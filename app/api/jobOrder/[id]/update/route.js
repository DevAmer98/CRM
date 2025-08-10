import { JobOrder } from '@/app/lib/models';
import { connectToDB } from '@/app/lib/utils';
import { NextResponse } from 'next/server';

export async function POST(req, { params }) {
  const { id } = params;
  const body = await req.json();
  const { projectType, projectStatus } = body;

  try {
    await connectToDB();

    await JobOrder.findByIdAndUpdate(id, {
      projectType,
      projectStatus,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Update Job Order]', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
