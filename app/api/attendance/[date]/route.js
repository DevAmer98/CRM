import { NextResponse } from 'next/server';
import { AttendanceDaily } from '@/app/lib/models';
import { formatDateTimeLocal } from '@/app/lib/attendance';
import { connectToDB } from '@/app/lib/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const date = params?.date;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) {
    return NextResponse.json({ error: 'Date must be YYYY-MM-DD' }, { status: 400 });
  }

  try {
    await connectToDB();

    const rows = await AttendanceDaily.find({ date }).lean();
    const result = {};

    for (const row of rows) {
      result[row.personName] = {
        firstIn: formatDateTimeLocal(new Date(row.firstIn)),
        lastOut: formatDateTimeLocal(new Date(row.lastOut)),
        firstConfidence: row.firstConfidence,
        lastConfidence: row.lastConfidence
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch attendance day:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  }
}
