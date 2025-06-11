import { fetchPurchaseOrder, fetchQuotation } from '@/app/lib/data';
import { NextResponse } from 'next/server';

export async function GET(req, context) {
    try {
        const { params } = context;
        const purchaseOrderId = params.purchaseOrderId;

        // Use fetchQuotation with the extracted quotationId
        const purchaseOrder = await fetchPurchaseOrder(purchaseOrderId);

        if (!purchaseOrder) {
            return new NextResponse(JSON.stringify({ message: 'Purchase Order not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new NextResponse(JSON.stringify(purchaseOrder), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new NextResponse(JSON.stringify({ message: 'Failed to fetch quotation' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
