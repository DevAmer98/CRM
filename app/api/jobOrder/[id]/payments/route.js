import { JobOrder } from "@/app/lib/models";
import { connectToDB } from "@/app/lib/utils";

export async function POST(req, { params }) {
  const { id } = params;
  const { newRemaining, status } = await req.json();

  await connectToDB();

  const jobOrder = await JobOrder.findById(id);
  if (!jobOrder) return new Response("Job order not found", { status: 404 });

  const originalValue = jobOrder.value ?? 0;
  const newPaidAmount = originalValue - newRemaining;

  jobOrder.remainingAmount = newRemaining;
  jobOrder.paidAmount = newPaidAmount;

  await jobOrder.save();

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}

