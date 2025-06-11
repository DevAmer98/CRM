import { fetchAllClients } from '@/app/lib/data'; // Adjust the import path as needed
import { NextResponse } from 'next/server';

export const revalidate = 0; 
export async function GET(req, res) {
    try {
        console.log('API: GET /api/allClients called');
        const clients = await fetchAllClients();
        console.log('API: Clients fetched:', clients);
        return NextResponse.json(clients);
    } catch (error) {
        console.error('API: Error fetching clients:', error);
        return res.status(500).json({ message: 'Failed to fetch clients' });
    }
}
