import { NextResponse } from "next/server";
import { Quotation, PurchaseOrder } from "@/app/lib/models";
import { connectToDB } from "@/app/lib/utils";

export const runtime = "nodejs";
export const revalidate = 0;
export const dynamic = "force-dynamic";

const normalizeStatus = value => String(value || "unknown");

export async function GET() {
  try {
    await connectToDB();

    const [
      quotationStatusAgg,
      poStatusAgg,
      quotationCurrencyAgg,
      poCurrencyAgg,
      topSuppliersAgg,
      topClientsAgg
    ] = await Promise.all([
      Quotation.aggregate([
        { $group: { _id: "$paymentStatus", count: { $sum: 1 } } }
      ]),
      PurchaseOrder.aggregate([
        { $group: { _id: "$paymentStatus", count: { $sum: 1 } } }
      ]),
      Quotation.aggregate([
        {
          $group: {
            _id: "$currency",
            total: { $sum: "$totalPrice" },
            count: { $sum: 1 }
          }
        }
      ]),
      PurchaseOrder.aggregate([
        {
          $group: {
            _id: "$currency",
            total: { $sum: "$totalPrice" },
            count: { $sum: 1 }
          }
        }
      ]),
      PurchaseOrder.aggregate([
        {
          $group: {
            _id: "$supplier",
            count: { $sum: 1 },
            total: { $sum: "$totalPrice" }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 6 },
        {
          $lookup: {
            from: "suppliers",
            localField: "_id",
            foreignField: "_id",
            as: "supplier"
          }
        },
        { $unwind: { path: "$supplier", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            supplierId: "$_id",
            name: { $ifNull: ["$supplier.name", "Unknown"] },
            count: 1,
            total: 1
          }
        }
      ]),
      Quotation.aggregate([
        {
          $group: {
            _id: "$client",
            count: { $sum: 1 },
            total: { $sum: "$totalPrice" }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 6 },
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
            clientId: "$_id",
            name: { $ifNull: ["$client.name", "Unknown"] },
            count: 1,
            total: 1
          }
        }
      ])
    ]);

    const quotationStatus = quotationStatusAgg.map(item => ({
      name: normalizeStatus(item._id),
      value: item.count
    }));
    const purchaseOrderStatus = poStatusAgg.map(item => ({
      name: normalizeStatus(item._id),
      value: item.count
    }));
    const quotationCurrency = quotationCurrencyAgg.map(item => ({
      name: item._id || "Unknown",
      total: Number(item.total || 0),
      count: item.count
    }));
    const purchaseOrderCurrency = poCurrencyAgg.map(item => ({
      name: item._id || "Unknown",
      total: Number(item.total || 0),
      count: item.count
    }));

    return NextResponse.json(
      {
        success: true,
        quotationStatus,
        purchaseOrderStatus,
        quotationCurrency,
        purchaseOrderCurrency,
        topSuppliers: topSuppliersAgg,
        topClients: topClientsAgg
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to load dashboard summary.",
        quotationStatus: [],
        purchaseOrderStatus: [],
        quotationCurrency: [],
        purchaseOrderCurrency: [],
        topSuppliers: [],
        topClients: []
      },
      { status: 500 }
    );
  }
}
