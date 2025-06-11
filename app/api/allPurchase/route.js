// pages/api/clients.js
import {fetchAllPurchase } from '@/app/lib/data'; // Adjust the import path as needed
import { NextResponse } from 'next/server';

export const revalidate = 0; 
export async function GET(req, res) {
    try {
        // ... your logic to handle the GET request ...
        const purchaseOrders = await fetchAllPurchase(); // Example function call
        console.log(purchaseOrders)
       return NextResponse.json(purchaseOrders);
    } catch (error) { 
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch purchaseOrders' });
    }
}
