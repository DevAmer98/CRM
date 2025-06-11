// api/quotation/[quotationId]/route.js
import { deleteQuotation } from '@/app/lib/actions';
import { fetchQuotation } from '@/app/lib/data';
import { Quotation } from '@/app/lib/models';
import { connectToDB } from '@/app/lib/utils';
import { NextResponse } from 'next/server';

// GET request handler
export async function GET(req, context) {
    try {
        const { params } = context;
        const quotationId = params.quotationId;

        // Use fetchQuotation with the extracted quotationId
        const quotation = await fetchQuotation(quotationId);

        if (!quotation) {
            return new NextResponse(JSON.stringify({ message: 'Quotation not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new NextResponse(JSON.stringify(quotation), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new NextResponse(JSON.stringify({ message: 'Failed to fetch quotation' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

// DELETE request handler
export async function DELETE(req, context) {
    const { params } = context;
    const quotationId = params.quotationId;

    try {
        await connectToDB();
        const deleteResult = await Quotation.findByIdAndDelete(quotationId);

        if (!deleteResult) {
            return new NextResponse(JSON.stringify({ message: 'Quotation not found or already deleted' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Assuming you want to revalidate the dashboard or the page listing all quotations
        try {
            // Trigger ISR revalidation
            await context.res.unstable_revalidate('/dashboard/quotations'); // Adjust path as needed
            console.log('Revalidation successful');
        } catch (err) {
            console.error('Revalidation failed', err);
            // Handle revalidation error appropriately
        }

        return new NextResponse(JSON.stringify({ message: 'Quotation deleted successfully' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new NextResponse(JSON.stringify({ message: 'Failed to delete quotation', error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

// Remove the default export and the handler function
// export default async function handler(req, res) { ... }