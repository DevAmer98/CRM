import { fetchAllQuotations } from '@/app/lib/data';
import { NextResponse } from 'next/server';

export const revalidate = 0;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const company = searchParams.get('company') || undefined;

    const quotations = await fetchAllQuotations(q, company);
    return NextResponse.json(quotations);
  } catch (error) {
    console.error('Error fetching quotations for export:', error);
    return NextResponse.json({ message: 'Failed to fetch quotations' }, { status: 500 });
  }
}
