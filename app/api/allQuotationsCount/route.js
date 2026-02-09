import { NextResponse } from 'next/server';
import { fetchQuotationCount } from '@/app/lib/data';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const count = await fetchQuotationCount();
    return NextResponse.json({ count }, { status: 200 });
  } catch (error) {
    console.error('quotationsCount error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch quotations count' },
      { status: 500 }
    );
  }
}
