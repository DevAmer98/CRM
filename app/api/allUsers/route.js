import { fetchAllUsers } from '@/app/lib/data'; // Adjust the import path as needed
import { NextResponse } from 'next/server';


export const revalidate = 0; 
export async function GET(req, res) {
    try {
        const count = await fetchAllUsers(); // Example function call
        console.log(count)
       return NextResponse.json(count);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch clients' });
    }
}
