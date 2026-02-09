import { NextResponse } from 'next/server';
import { fetchPurchaseOrderCount } from '@/app/lib/data';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const count = await fetchPurchaseOrderCount();
    return NextResponse.json({ count }, { status: 200 });
  } catch (error) {
    console.error('purchaseOrdersCount error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch purchase orders count' },
      { status: 500 }
    );
  }
}
