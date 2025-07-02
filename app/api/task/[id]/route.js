import { NextResponse } from 'next/server';
import { markTaskAsDone } from '@/app/lib/actions';

export async function PATCH(req, { params }) {
  const { id } = params;

  try {
    const updatedTask = await markTaskAsDone(id);
    return NextResponse.json(updatedTask, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
