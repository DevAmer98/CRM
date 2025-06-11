// pages/api/clients.js
import {fetchAllJobs} from '@/app/lib/data'; // Adjust the import path as needed
import { NextResponse } from 'next/server';

export const revalidate = 0; 
export async function GET(req, res) {
    try {
        const jobOrders = await fetchAllJobs(); // Example function call
        console.log(jobOrders)
       return NextResponse.json(jobOrders);
    } catch (error) { 
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch jobOrders' });
    }
}
