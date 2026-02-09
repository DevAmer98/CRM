import { NextResponse } from "next/server";
import { Client } from "@/app/lib/models";
import { connectToDB } from "@/app/lib/utils";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET(request) {
  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = Number.isFinite(Number(limitParam)) ? Math.min(Number(limitParam), 20) : 6;

  try {
    await connectToDB();
    const clients = await Client.find({})
      .select("name contactName email phone createdAt")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json(
      clients.map(client => ({
        id: String(client._id),
        name: client.name,
        contactName: client.contactName || "",
        email: client.email || "",
        phone: client.phone || "",
        createdAt: client.createdAt ? new Date(client.createdAt).toISOString() : null
      })),
      { status: 200 }
    );
  } catch (error) {
    console.error("latest clients error:", error);
    return NextResponse.json({ message: "Failed to fetch latest clients" }, { status: 500 });
  }
}
