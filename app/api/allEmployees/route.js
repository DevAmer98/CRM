import { Employee } from '@/app/lib/models';
import { connectToDB } from '@/app/lib/utils';
import { NextResponse } from 'next/server';

export const GET = async () => {
  try {
    await connectToDB();
    const employees = await Employee.find({}, 'name jobTitle contractEndDate'); // Fetch only needed fields
    return NextResponse.json(employees);
  } catch (err) {
    console.error('Failed to fetch employees:', err);
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
};
