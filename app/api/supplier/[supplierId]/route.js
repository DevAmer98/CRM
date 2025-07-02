import { fetchPurchaseOrdersForSupplier } from '@/app/lib/data';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
  const { supplierId } = params;

  if (!supplierId) {
    return NextResponse.json({ error: "Missing supplierId" }, { status: 400 });
  }

  try {
    const orders = await fetchPurchaseOrdersForSupplier(supplierId);
    return NextResponse.json({ orders }, { status: 200 });
  } catch (err) {
    console.error('Error fetching purchase orders:', err);
    return NextResponse.json({ error: 'Could not fetch purchase orders' }, { status: 500 });
  }
}
