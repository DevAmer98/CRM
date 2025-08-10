import { NextResponse } from 'next/server';
import { connectToDB } from '@/app/lib/utils';
import { Ticket } from '@/app/lib/models';
import { auth } from '../auth/[...nextauth]/route';

export const revalidate = 0;

export async function POST(req) {
  try {
    const session = await auth();

    /*if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }
*/
    const body = await req.json();
    const { title, description, deadline, assignedTo } = body;

    await connectToDB();

    const ticket = await Ticket.create({
      title,
      description,
      deadline,
      assignedTo,
      createdBy: session.user.id,
    });

    return NextResponse.json({ success: true, ticket }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Failed to create ticket' }, { status: 500 });
  }
}
