import { NextResponse } from 'next/server';
import { addTaskComment } from '@/app/lib/actions';

export async function POST(req, { params }) {
  const { id } = params;
  try {
    const payload = await req.json();
    const message = payload?.message || '';
    const result = await addTaskComment(id, message);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
