/*import {fetchLatestQuotations } from '@/app/lib/data'; // Adjust the import path as needed
import { NextResponse } from 'next/server';

export async function GET(req, res) {
    try {
        const quotations = await fetchLatestQuotations(); // Example function call
        console.log(quotations)
       return NextResponse.json(quotations);
    } catch (error) { 
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch quotations' });
    }
}
*/