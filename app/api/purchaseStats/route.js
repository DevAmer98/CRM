import { NextResponse } from 'next/server';
import { fetchPurchaseApprovalStats} from '@/app/lib/data';

export async function GET() {
  try {
    const stats = await fetchPurchaseApprovalStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: 'Failed to fetch purchase order stats' }, { status: 500 });
  }
}
