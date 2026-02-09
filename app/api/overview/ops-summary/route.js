import { NextResponse } from "next/server";
import { Lead, JobOrder, Pl, Coc } from "@/app/lib/models";
import { connectToDB } from "@/app/lib/utils";

export const runtime = "nodejs";
export const revalidate = 0;
export const dynamic = "force-dynamic";

const formatMonthKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const monthRangeKeys = (monthsBack = 5) => {
  const keys = [];
  const cursor = new Date();
  cursor.setDate(1);
  cursor.setHours(0, 0, 0, 0);
  cursor.setMonth(cursor.getMonth() - monthsBack);
  for (let i = 0; i <= monthsBack; i += 1) {
    keys.push(formatMonthKey(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return keys;
};

export async function GET() {
  try {
    await connectToDB();

    const [leadStatusAgg, jobOrderStatusAgg, leadTotal, jobOrderTotal, pickListTotal, cocTotal] =
      await Promise.all([
        Lead.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
        JobOrder.aggregate([{ $group: { _id: "$projectStatus", count: { $sum: 1 } } }]),
        Lead.countDocuments({}),
        JobOrder.countDocuments({}),
        Pl.countDocuments({}),
        Coc.countDocuments({})
      ]);

    const months = monthRangeKeys(5);
    const startDate = new Date(`${months[0]}-01T00:00:00.000Z`);
    const endDate = new Date();

    const [leadMonthlyAgg, jobOrderMonthlyAgg] = await Promise.all([
      Lead.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            count: { $sum: 1 }
          }
        }
      ]),
      JobOrder.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const leadMonthlyMap = Object.fromEntries(leadMonthlyAgg.map(x => [x._id, x.count]));
    const jobOrderMonthlyMap = Object.fromEntries(jobOrderMonthlyAgg.map(x => [x._id, x.count]));
    const monthlyTrend = months.map(month => ({
      month,
      leads: leadMonthlyMap[month] || 0,
      jobOrders: jobOrderMonthlyMap[month] || 0
    }));

    return NextResponse.json(
      {
        success: true,
        totals: {
          leads: leadTotal,
          jobOrders: jobOrderTotal,
          pickLists: pickListTotal,
          coc: cocTotal
        },
        leadStatus: leadStatusAgg.map(item => ({ name: item._id || "Unknown", value: item.count })),
        jobOrderStatus: jobOrderStatusAgg.map(item => ({ name: item._id || "Unknown", value: item.count })),
        monthlyTrend
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to load ops summary.",
        totals: { leads: 0, jobOrders: 0, pickLists: 0, coc: 0 },
        leadStatus: [],
        jobOrderStatus: [],
        monthlyTrend: []
      },
      { status: 500 }
    );
  }
}
