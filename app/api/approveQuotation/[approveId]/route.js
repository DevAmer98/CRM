/*import { fetchApprove } from '@/app/lib/data';
import { NextResponse } from 'next/server';

export async function GET(req, context) {
    try {
        const { params } = context;
        const approveId = params.approveId;

        // Use fetchQuotation with the extracted quotationId
        const approve = await fetchApprove(approveId);

        if (!approve) {
            return new NextResponse(JSON.stringify({ message: 'approve not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new NextResponse(JSON.stringify(approve), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new NextResponse(JSON.stringify({ message: 'Failed to fetch approve' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}*/
