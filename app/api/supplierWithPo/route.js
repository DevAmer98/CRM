import {fetchSuppliersWithPurchaseOrders } from '@/app/lib/data';
import { NextResponse } from 'next/server';


export const revalidate = 0; 
export async function POST(req) {
    try {
        const suppliersWithPurchaseOrders = await fetchSuppliersWithPurchaseOrders();
        return new NextResponse(JSON.stringify({ suppliersWithPurchaseOrders }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        console.error(error);
        return new NextResponse(JSON.stringify({ message: 'Failed to fetch suppliers with purchaseOrders' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
}
