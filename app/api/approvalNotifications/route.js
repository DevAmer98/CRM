import { NextResponse } from "next/server";
import { connectToDB } from "@/app/lib/utils";
import { Quotation } from "@/app/lib/models";

export const revalidate = 0;

export async function GET() {
  try {
    await connectToDB();

    const pendingApprovals = await Quotation.find({
      $or: [{ user: { $exists: false } }, { user: null }],
    })
      .populate("client", "name")
      .sort({ createdAt: -1 })
      .limit(15)
      .lean();

    const formatted = pendingApprovals.map((quotation) => ({
      id: quotation._id.toString(),
      quotationId: quotation.quotationId,
      projectName: quotation.projectName || "Untitled Project",
      clientName: quotation.client?.name || "Unknown Client",
      createdAt: quotation.createdAt,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Failed to load approval notifications:", error);
    return NextResponse.json(
      { message: "Failed to load approval notifications" },
      { status: 500 }
    );
  }
}
