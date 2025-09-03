import { NextResponse } from 'next/server';
import { fetchDepartmentCount } from '@/app/lib/data';

export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET() {
  try {
    const count = await fetchDepartmentCount();
    return new NextResponse(JSON.stringify({ count }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('departmentsCount error:', error);
    return new NextResponse(JSON.stringify({ message: 'Failed to fetch department count' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
