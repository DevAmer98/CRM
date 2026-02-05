import { AttendanceDaily, AttendanceEvent } from '@/app/lib/models';
import { connectToDB } from '@/app/lib/utils';

const ATTENDANCE_TIMEZONE = process.env.ATTENDANCE_TIMEZONE || 'Asia/Riyadh';
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

export function formatDateKey(date) {
  const parts = toPartsMap(dateKeyFormatter, date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function formatDateTimeLocal(date) {
  const parts = toPartsMap(dateTimeFormatter, date);
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

export async function upsertAttendanceRecord(record) {
  await connectToDB();

  await AttendanceEvent.create(record);

  const summaryKey = {
    personKey: record.personKey,
    date: record.date
  };

  const existing = await AttendanceDaily.findOne(summaryKey);
  if (!existing) {
    await AttendanceDaily.create({
      ...summaryKey,
      personName: record.personName,
      personId: record.personId,
      firstIn: record.eventAt,
      lastOut: record.eventAt,
      firstConfidence: record.confidence,
      lastConfidence: record.confidence
    });
    return;
  }

  let changed = false;
  existing.personName = record.personName || existing.personName;
  existing.personId = record.personId || existing.personId;

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
