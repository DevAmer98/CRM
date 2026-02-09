import { NextResponse } from "next/server";
import { updateTaskStatus } from "@/app/lib/actions";

export async function PATCH(req, { params }) {
  const { id } = params;
  try {
    const payload = await req.json();
    const status = payload?.status;
    const result = await updateTaskStatus(id, status);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
