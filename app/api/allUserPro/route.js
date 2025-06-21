import { fetchAllProcurementUsers } from "@/app/lib/data";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log('API: GET /api/allUserPro called');
    const userPro = await fetchAllProcurementUsers(); 
    console.log('Returned Users:', userPro); // ✅ add this log
    return NextResponse.json(userPro);
  } catch (error) { 
    console.error(error);
    return NextResponse.json({ message: 'Failed to fetch procurement users' }, { status: 500 });
  }
}