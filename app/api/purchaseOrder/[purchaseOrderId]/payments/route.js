import { PurchaseOrder } from "@/app/lib/models";
import { connectToDB } from "@/app/lib/utils";


export async function POST(req, { params }) {
const { purchaseOrderId } = params;
  const { newRemaining, status } = await req.json();

  await connectToDB();

  const po = await PurchaseOrder.findOne({ _id: purchaseOrderId }); // supports string _id
  if (!po) return new Response("Purchase Order not found", { status: 404 });

  po.remainingAmount = newRemaining;
  po.paymentStatus = status; // Optional field if you added it
  await po.save();

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
