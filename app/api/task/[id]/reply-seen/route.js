import { NextResponse } from 'next/server';
import { markTaskReplySeen } from '@/app/lib/actions';

export async function POST(req, { params }) {
  const { id } = params;
  try {
    const result = await markTaskReplySeen(id);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
