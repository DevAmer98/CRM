import { Client, JobOrder, Quotation } from "@/app/lib/models";
import { connectToDB } from "@/app/lib/utils";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const {
      poNumber,
      poDate,
      clientId,
      quotationId,
      value, // ✅ coming from the form (user input)
      currency = 'USD',
      projectType = 'Supply',
      projectStatus = 'OPEN',
    } = await req.json();

    if (!value || isNaN(value)) {
      return NextResponse.json({ error: 'Invalid value' }, { status: 400 });
    }

    await connectToDB();

    const client = await Client.findById(clientId).lean();
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const quotation = await Quotation.findById(quotationId).lean();
    if (!quotation || quotation.client.toString() !== client._id.toString()) {
      return NextResponse.json({ error: 'Quotation not found or does not belong to client' }, { status: 400 });
    }

    const year = new Date().getFullYear();
    const latestJobOrder = await JobOrder.findOne({
      jobOrderId: { $regex: `SVSJO-${year}-` },
    }).sort({ jobOrderId: -1 });

    let sequenceNumber = '050';
    if (latestJobOrder) {
      const currentNumber = parseInt(latestJobOrder.jobOrderId.split('-')[2]);
      sequenceNumber = String(currentNumber + 1).padStart(3, '0');
    }

    const customJobOrderId = `SVSJO-${year}-${sequenceNumber}`;

    const baseValue = parseFloat(value);
    const valueWithVAT = currency === 'SAR'
      ? parseFloat((baseValue * 1.15).toFixed(2))
      : baseValue;

    const jobOrder = new JobOrder({
      jobOrderId: customJobOrderId,
      poNumber,
      poDate,
      client: client._id,
      quotation: quotation._id,
      projectType,
      projectStatus,
      baseValue: currency === 'SAR' ? baseValue : 0,
      value: valueWithVAT,
      currency,
      remainingAmount: valueWithVAT,
    });

    await jobOrder.save();

    return NextResponse.json({ success: true, jobOrder });
  } catch (error) {
    console.error('Error creating job order:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
