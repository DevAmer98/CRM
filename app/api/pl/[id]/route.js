import { fetchPl } from '@/app/lib/data';
import { NextResponse } from 'next/server';

export async function GET(req, context) {
    try {
        const { params } = context;
        const plId = params.id;

        const pl = await fetchPl(plId);

        if (!pl) {
            return new NextResponse(JSON.stringify({ message: 'pl not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new NextResponse(JSON.stringify(pl), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error in GET route:', error);
        return new NextResponse(JSON.stringify({ message: 'Failed to fetch pl' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
