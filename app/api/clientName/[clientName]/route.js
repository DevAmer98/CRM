/*import { fetchQuotationsForClient } from '@/app/lib/data';
import { NextResponse } from 'next/server';

export async function GET(req, context) { 
  const { params } = context;
  const clientName = params.clientName;
  try {
    // Fetch quotations using a function that queries your database
    const quotations = await fetchQuotationsForClient(clientName);

    if (!quotations) {
      return new NextResponse(JSON.stringify({ message: 'No quotations found for this client' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new NextResponse(JSON.stringify({ quotations }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching quotations:', error);
    return new NextResponse(JSON.stringify({ message: 'Failed to fetch quotations' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export default GET;*/
