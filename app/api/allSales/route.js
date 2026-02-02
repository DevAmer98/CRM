import { fetchSalesByUserRoles } from '@/app/lib/data'; 
import { NextResponse } from 'next/server';


export const revalidate = 0; 
export async function GET(req, res) {
    try {
        console.log('API: GET /api/allSales called');
        const sales = await fetchSalesByUserRoles(); 
       return NextResponse.json(sales);
    } catch (error) { 
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch sales' });
    }
}
