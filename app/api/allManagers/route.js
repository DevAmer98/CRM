import {fetchAllManagers } from '@/app/lib/data'; // Adjust the import path as needed
import { NextResponse } from 'next/server';

export const revalidate = 0; 
export async function GET(req, res) {
    try {
        const managers = await fetchAllManagers();
        return NextResponse.json(managers);
    } catch (error) {
        console.error('API: Error fetching managers:', error);
        return res.status(500).json({ message: 'Failed to fetch managers' });
    }
}
