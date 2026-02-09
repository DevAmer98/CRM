import { NextResponse } from "next/server";
import { Client, Lead, Quotation } from "@/app/lib/models";
import { connectToDB } from "@/app/lib/utils";

export const runtime = "nodejs";
export const revalidate = 0;
export const dynamic = "force-dynamic";

const toMonthKey = date => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export async function GET() {
  try {
    await connectToDB();

    const [
      clientCount,
      leadCount,
      leadStatusAgg,
      leadSourceAgg,
      wonLeadsCount,
      recentClientCount,
      clientRevenueAgg
    ] = await Promise.all([
      Client.countDocuments({}),
      Lead.countDocuments({}),
      Lead.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Lead.aggregate([{ $group: { _id: "$source", count: { $sum: 1 } } }]),
      Lead.countDocuments({ status: "Won" }),
      Client.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }),
      Quotation.aggregate([
        {
          $group: {
            _id: "$client",
            total: { $sum: "$totalPrice" },
            count: { $sum: 1 }
          }
        },
        { $sort: { total: -1 } },
        { $limit: 12 },
        {
          $lookup: {
            from: "clients",
            localField: "_id",
            foreignField: "_id",
            as: "client"
          }
        },
        { $unwind: { path: "$client", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            name: { $ifNull: ["$client.name", "Unknown"] },
            total: 1
          }
        }
      ])
    ]);

    const conversionRate = leadCount > 0 ? Math.round((wonLeadsCount / leadCount) * 100) : 0;

    return NextResponse.json(
      {
        success: true,
        counts: {
          clients: clientCount,
          leads: leadCount,
          newClients: recentClientCount,
          conversionRate
        },
        leadStatus: leadStatusAgg.map(item => ({ role: item._id || "Unknown", count: item.count })),
        leadSource: leadSourceAgg.map(item => ({ role: item._id || "Unknown", count: item.count })),
        clientRevenue: clientRevenueAgg.map(item => ({ name: item.name, pv: item.total }))
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to load client summary.",
        counts: { clients: 0, leads: 0, newClients: 0, conversionRate: 0 },
        leadStatus: [],
        leadSource: [],
        clientRevenue: []
      },
      { status: 500 }
    );
  }
}
