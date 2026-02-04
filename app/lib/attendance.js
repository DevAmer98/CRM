import { AttendanceDaily, AttendanceEvent } from '@/app/lib/models';
import { connectToDB } from '@/app/lib/utils';

function pad2(value) {
  return String(value).padStart(2, '0');
}

export function formatDateKey(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function formatDateTimeLocal(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
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
