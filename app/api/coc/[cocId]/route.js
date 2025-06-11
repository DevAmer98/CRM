import { fetchCoc } from '@/app/lib/data';
import { NextResponse } from 'next/server';

export async function GET(req, context) {
    try {
        const { params } = context;
        const cocId = params.cocId;

        const coc = await fetchCoc(cocId);

        if (!coc) {
            return new NextResponse(JSON.stringify({ message: 'Coc not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new NextResponse(JSON.stringify(coc), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error in GET route:', error);
        return new NextResponse(JSON.stringify({ message: 'Failed to fetch coc' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
