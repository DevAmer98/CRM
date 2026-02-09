import { NextResponse } from "next/server";
import { Quotation, PurchaseOrder } from "@/app/lib/models";
import { connectToDB } from "@/app/lib/utils";

export const runtime = "nodejs";
export const revalidate = 0;
export const dynamic = "force-dynamic";

const isDateKey = value => /^\d{4}-\d{2}-\d{2}$/.test(value || "");

const formatDateKey = date => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const dateRangeKeys = (from, to) => {
  const result = [];
  const cursor = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  while (cursor <= end) {
    result.push(formatDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
};

export async function GET(request) {
  const searchFrom = request.nextUrl.searchParams.get("from");
  const searchTo = request.nextUrl.searchParams.get("to");
  const today = new Date();
  const defaultFromDate = new Date();
  defaultFromDate.setDate(today.getDate() - 13);

  let from = isDateKey(searchFrom) ? searchFrom : formatDateKey(defaultFromDate);
  let to = isDateKey(searchTo) ? searchTo : formatDateKey(today);
  if (from > to) {
    const swap = from;
    from = to;
    to = swap;
  }

  try {
    await connectToDB();

    const fromDate = new Date(`${from}T00:00:00.000Z`);
    const toDate = new Date(`${to}T23:59:59.999Z`);
    const rangeDates = dateRangeKeys(from, to);

    const [quoteAgg, poAgg] = await Promise.all([
      Quotation.aggregate([
        { $match: { createdAt: { $gte: fromDate, $lte: toDate } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        }
      ]),
      PurchaseOrder.aggregate([
        { $match: { createdAt: { $gte: fromDate, $lte: toDate } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const quotesByDay = Object.fromEntries(quoteAgg.map(x => [x._id, x.count]));
    const posByDay = Object.fromEntries(poAgg.map(x => [x._id, x.count]));

    const trend = rangeDates.map(date => ({
      date,
      quotations: quotesByDay[date] || 0,
      purchaseOrders: posByDay[date] || 0
    }));

    return NextResponse.json({ success: true, from, to, trend }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to fetch quotation/PO trend.",
        from,
        to,
        trend: []
      },
      { status: 500 }
    );
  }
}
