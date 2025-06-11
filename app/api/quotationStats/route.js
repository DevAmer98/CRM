import { NextResponse } from 'next/server';
import { fetchQuotationApprovalStats } from '@/app/lib/data';

export async function GET() {
  try {
    const stats = await fetchQuotationApprovalStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: 'Failed to fetch quotation stats' }, { status: 500 });
  }
}
