import { JobOrder } from '@/app/lib/models';
import { connectToDB } from '@/app/lib/utils';
import { NextResponse } from 'next/server';

export async function POST(req, { params }) {
  const { id } = params;
  const body = await req.json();

  const allowedFields = [
    'projectType',
    'projectStatus',
    'poNumber',
    'poDate',
    'value',
    'baseValue',
    'currency',
  ];

  const updateData = allowedFields.reduce((acc, field) => {
    if (body[field] !== undefined) {
      acc[field] = body[field];
    }
    return acc;
  }, {});

  if (updateData.value !== undefined) {
    updateData.value = Number(updateData.value);
  }

  if (updateData.baseValue !== undefined) {
    updateData.baseValue = Number(updateData.baseValue);
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { success: false, message: 'No valid fields provided.' },
      { status: 400 }
    );
  }

  try {
    await connectToDB();

    const updatedJobOrder = await JobOrder.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedJobOrder) {
      return NextResponse.json(
        { success: false, message: 'Job order not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, jobOrder: updatedJobOrder });
  } catch (error) {
    console.error('[Update Job Order]', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
