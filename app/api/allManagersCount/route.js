import { NextResponse } from 'next/server';
import { fetchManagersCount } from '@/app/lib/data';

export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET() {
  try {
    const count = await fetchManagersCount(); // should return a plain number
    return new NextResponse(JSON.stringify({ count }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('managersCount error:', error);
    return new NextResponse(JSON.stringify({ message: 'Failed to fetch manager count' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
