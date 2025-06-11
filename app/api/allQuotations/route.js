// pages/api/clients.js
import {fetchAllQuotations } from '@/app/lib/data'; // Adjust the import path as needed
import { NextResponse } from 'next/server';

export const revalidate = 0; 
export async function GET(req, res) {
    try {
        // ... your logic to handle the GET request ...
        const quotations = await fetchAllQuotations(); // Example function call
        console.log(quotations)
       return NextResponse.json(quotations);
    } catch (error) { 
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch quotations' });
    }
}
