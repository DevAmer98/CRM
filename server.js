require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = Number(process.env.ATTENDANCE_PORT || 9000);
const MONGO_URI = process.env.MONGO;
const ATTENDANCE_TIMEZONE = process.env.ATTENDANCE_TIMEZONE || 'Asia/Riyadh';
const accessEvents = [];

const attendanceEventSchema = new mongoose.Schema(
  {
    personName: { type: String, required: true },
    personId: { type: String, default: '' },
    confidence: { type: Number, default: 0 },
    eventAt: { type: Date, required: true, index: true },
    date: { type: String, required: true, index: true },
    time: { type: String, required: true },
    libId: { type: Number },
    verifyMode: { type: Number }
  },
  { timestamps: true, collection: 'attendance_events' }
);

const attendanceDailySchema = new mongoose.Schema(
  {
    personName: { type: String, required: true },
    personId: { type: String, default: '', index: true },
    date: { type: String, required: true, index: true },
    firstIn: { type: Date, required: true },
    lastOut: { type: Date, required: true },
    firstConfidence: { type: Number, default: 0 },
    lastConfidence: { type: Number, default: 0 }
  },
  { timestamps: true, collection: 'attendance_daily' }
);

attendanceDailySchema.index({ personId: 1, date: 1 }, { unique: true });

const AttendanceEvent =
  mongoose.models.AttendanceEvent ||
  mongoose.model('AttendanceEvent', attendanceEventSchema);
const AttendanceDaily =
  mongoose.models.AttendanceDaily ||
  mongoose.model('AttendanceDaily', attendanceDailySchema);

let mongoConnectPromise = null;

function ensureMongoConnected() {
  if (!MONGO_URI) return Promise.resolve(null);
  if (mongoose.connection.readyState === 1) return Promise.resolve(mongoose.connection);
  if (!mongoConnectPromise) {
    mongoConnectPromise = mongoose
      .connect(MONGO_URI)
      .then(() => {
        console.log('✅ Attendance server connected to MongoDB');
        return mongoose.connection;
      })
      .catch(err => {
        mongoConnectPromise = null;
        throw err;
      });
  }
  return mongoConnectPromise;
}

const dateKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: ATTENDANCE_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});
const dateTimeFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: ATTENDANCE_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
});

function toPartsMap(formatter, date) {
  return Object.fromEntries(
    formatter.formatToParts(date).map(part => [part.type, part.value])
  );
}

function formatDateTimeLocal(date) {
  const parts = toPartsMap(dateTimeFormatter, date);
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

function formatDateKey(date) {
  const parts = toPartsMap(dateKeyFormatter, date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

async function persistAttendance(record) {
  if (!MONGO_URI) return;

  await ensureMongoConnected();

  await AttendanceEvent.create(record);

  const summaryKey = {
    personId: record.personId || `name:${record.personName}`,
    date: record.date
  };

  const existing = await AttendanceDaily.findOne(summaryKey);
  if (!existing) {
    await AttendanceDaily.create({
      ...summaryKey,
      personName: record.personName,
      firstIn: record.eventAt,
      lastOut: record.eventAt,
      firstConfidence: record.confidence,
      lastConfidence: record.confidence
    });
    return;
  }

  let changed = false;
  existing.personName = record.personName || existing.personName;

  if (record.eventAt < existing.firstIn) {
    existing.firstIn = record.eventAt;
    existing.firstConfidence = record.confidence;
    changed = true;
  }
  if (record.eventAt > existing.lastOut) {
    existing.lastOut = record.eventAt;
    existing.lastConfidence = record.confidence;
    changed = true;
  }

  if (changed) {
    await existing.save();
  } else {
    await AttendanceDaily.updateOne(summaryKey, { $set: { updatedAt: new Date() } });
  }
}

/* =========================================
   RAW BODY PARSER (UNV sends broken headers)
========================================= */
app.use((req, res, next) => {
  let data = '';
  req.on('data', chunk => {
    data += chunk;
  });
  req.on('end', () => {
    req.rawBody = data;
    next();
  });
});

/* =========================================
   CATCH ALL UNV PUSH (POST ONLY)
========================================= */
app.use((req, res, next) => {
  if (req.method !== 'POST') return next();

  console.log('📥 UNV PUSH RECEIVED');
  console.log('PATH:', req.originalUrl);

  let body;
  try {
    body = req.rawBody ? JSON.parse(req.rawBody) : req.body;
    console.log(JSON.stringify(body, null, 2));
  } catch (e) {
    console.log('⚠️ Non-JSON payload');
    return res.json({ Response: { StatusCode: 0 } });
  }

  // ✅ Handle FACE VERIFICATION EVENTS
  if (
    req.originalUrl.includes('PersonVerification') &&
    body?.LibMatInfoList?.length
  ) {
    const match = body.LibMatInfoList[0];
    const person = match.MatchPersonInfo || {};

    const tsSeconds = Number(body.Timestamp);
    const eventAt = Number.isFinite(tsSeconds) ? new Date(tsSeconds * 1000) : new Date();
    const record = {
      personName: person.PersonName || 'Unknown',
      personId: String(match.MatchPersonID || ''),
      confidence: Number(match.MatchFaceConfidence || 0),
      eventAt,
      date: formatDateKey(eventAt),
      time: formatDateTimeLocal(eventAt),
      libId: match.LibID,
      verifyMode: match.VerifyMode
    };

    accessEvents.push(record);
    if (accessEvents.length > 2000) accessEvents.shift();

    console.log(
      `✅ STORED: ${record.personName} @ ${record.time} (${record.confidence}%)`
    );

    persistAttendance(record).catch(err => {
      console.error('❌ Failed to persist attendance:', err.message);
    });
  }

  // Always ACK device
  res.json({
    Response: {
      StatusCode: 0,
      StatusString: 'Succeed'
    }
  });
});

/* =========================================
   DEBUG APIs
========================================= */
app.get('/events', async (req, res) => {
  if (!MONGO_URI) {
    return res.json(accessEvents);
  }

  try {
    await ensureMongoConnected();
    const rows = await AttendanceEvent.find({})
      .sort({ eventAt: -1 })
      .limit(500)
      .lean();
    return res.json(rows);
  } catch (err) {
    console.error('Failed to fetch events from MongoDB:', err.message);
    return res.status(500).json({ error: 'Failed to fetch events' });
  }
});

app.get('/attendance/:date', async (req, res) => {
  const date = req.params.date;
  const result = {};

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Date must be YYYY-MM-DD' });
  }

  if (MONGO_URI) {
    try {
      await ensureMongoConnected();
      const rows = await AttendanceDaily.find({ date }).lean();
      for (const row of rows) {
        result[row.personName] = {
          firstIn: formatDateTimeLocal(new Date(row.firstIn)),
          lastOut: formatDateTimeLocal(new Date(row.lastOut)),
          firstConfidence: row.firstConfidence,
          lastConfidence: row.lastConfidence
        };
      }
      return res.json(result);
    } catch (err) {
      console.error('Failed to fetch attendance from MongoDB:', err.message);
      return res.status(500).json({ error: 'Failed to fetch attendance' });
    }
  }

  accessEvents
    .filter(e => e.time?.startsWith(date))
    .forEach(e => {
      if (!result[e.personName]) {
        result[e.personName] = {
          firstIn: e.time,
          lastOut: e.time
        };
      } else {
        if (e.time < result[e.personName].firstIn)
          result[e.personName].firstIn = e.time;
        if (e.time > result[e.personName].lastOut)
          result[e.personName].lastOut = e.time;
      }
    });

  res.json(result);
});

/* =========================================
   START SERVER
========================================= */
app.listen(PORT, () => {
  console.log(`🚀 UNV Attendance Server running on port ${PORT}`);
  console.log('📡 Waiting for device push events...');
});
