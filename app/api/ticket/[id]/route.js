import { NextResponse } from 'next/server';
import { markTicketAsDone } from '@/app/lib/actions';

export async function PATCH(req, { params }) {
  const { id } = params;

  try {
    const updatedTicket = await markTicketAsDone(id);
    return NextResponse.json(updatedTicket, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
