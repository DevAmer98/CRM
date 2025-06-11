import { fetchUserCount } from '@/app/lib/data';
import { NextResponse } from 'next/server';

export const revalidate = 0; 
export async function GET() {
  try {
    const userCount = await fetchUserCount(); // Get the user count
    console.log(userCount);
    // Return the count as a JSON object
    return new NextResponse(JSON.stringify({ count: userCount }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',

      },
    });
  } catch (error) {
    console.error(error);
    // Return an error response
    return new NextResponse(JSON.stringify({ message: 'Failed to fetch user count' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',

      },
    });
  }
}
