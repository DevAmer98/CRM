/*import { fetchAllDepartments } from '@/app/lib/data'; // Adjust the import path as needed
import { NextResponse } from 'next/server';

export const revalidate = 0; 
export async function GET(req, res) {
    try {
        const clients = await fetchAllDepartments();
        console.log('API: Departments fetched:', clients);
        return NextResponse.json(clients);
    } catch (error) {
        console.error('API: Error fetching departments:', error);
        return res.status(500).json({ message: 'Failed to fetch departments' });
    }
}
*/


import { NextResponse } from 'next/server';
import { fetchAllDepartments } from '@/app/lib/data';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const departments = await fetchAllDepartments();
    return NextResponse.json(departments, { status: 200 });
  } catch (error) {
    console.error('API: Error fetching departments:', error);
    return NextResponse.json(
      { message: 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}
