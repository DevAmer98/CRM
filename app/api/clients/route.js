// pages/api/clients.js
import { fetchClients } from '@/app/lib/data'; // Adjust the import path as needed
import { NextResponse } from 'next/server';

export async function GET(req, res) {
    try {
        // ... your logic to handle the GET request ...
        const clients = await fetchClients(); // Example function call
        console.log(clients)
       return NextResponse.json(clients);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch clients' });
    }
}
