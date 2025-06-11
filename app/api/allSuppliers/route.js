import {fetchAllSupliers } from '@/app/lib/data'; // Adjust the import path as needed
import { NextResponse } from 'next/server';

export const revalidate = 0; 
export async function GET(req, res) {
    try {
        // ... your logic to handle the GET request ...
        const suppliers = await fetchAllSupliers(); // Example function call
        console.log(suppliers)
       return NextResponse.json(suppliers);
    } catch (error) { 
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch clients' });
    }
}
