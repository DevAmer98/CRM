/*import { fetchClientsWithQuotations } from '@/app/lib/data';
import { NextResponse } from 'next/server';

export async function GET(req) {
    try {
        const clientsWithQuotations = await fetchClientsWithQuotations();
        return new NextResponse(JSON.stringify({ clientsWithQuotations }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        console.error(error);
        return new NextResponse(JSON.stringify({ message: 'Failed to fetch clients with quotations' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
}
*/