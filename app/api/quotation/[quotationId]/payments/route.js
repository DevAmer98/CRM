import { Quotation } from "@/app/lib/models";
import { connectToDB } from "@/app/lib/utils";


export async function POST(req, { params }) {
const { quotationId } = params;
  const { newRemaining, status } = await req.json();

  await connectToDB();

  const quotation = await Quotation.findOne({ _id: quotationId }); // supports string _id
  if (!quotation) return new Response("Quotation not found", { status: 404 });

  quotation.remainingAmount = newRemaining;
  quotation.paymentStatus = status; // Optional field if you added it
  await quotation.save(); 

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
