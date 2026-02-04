import { formatDateKey, formatDateTimeLocal, upsertAttendanceRecord } from '@/app/lib/attendance';

export const UNV_ACK = {
  Response: {
    StatusCode: 0,
    StatusString: 'Succeed'
  }
};

export async function handleUnvWebhook(request, pathname = '') {
  let body;

  try {
    const raw = await request.text();
    body = raw ? JSON.parse(raw) : {};
  } catch {
    return { ack: UNV_ACK, stored: false };
  }

  const hasFaceData = Array.isArray(body?.LibMatInfoList) && body.LibMatInfoList.length > 0;
  const isPersonVerificationPath = pathname.includes('PersonVerification');

  if (!hasFaceData && !isPersonVerificationPath) {
    return { ack: UNV_ACK, stored: false };
  }

  try {
    const match = body.LibMatInfoList?.[0] || {};
    const person = match.MatchPersonInfo || {};

    const tsSeconds = Number(body.Timestamp);
    const eventAt = Number.isFinite(tsSeconds) ? new Date(tsSeconds * 1000) : new Date();
    const personName = person.PersonName || 'Unknown';
    const personId = String(match.MatchPersonID || '');
    const personKey = personId || `name:${personName}`;

    const record = {
      personName,
      personId,
      personKey,
      confidence: Number(match.MatchFaceConfidence || 0),
      eventAt,
      date: formatDateKey(eventAt),
      time: formatDateTimeLocal(eventAt),
      libId: match.LibID,
      verifyMode: match.VerifyMode
    };

    await upsertAttendanceRecord(record);
    console.log(`✅ STORED: ${record.personName} @ ${record.time} (${record.confidence}%)`);
    return { ack: UNV_ACK, stored: true };
  } catch (error) {
    console.error('❌ Failed to persist UNV attendance:', error.message);
    return { ack: UNV_ACK, stored: false };
  }
}
