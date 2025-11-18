import { Client, JobOrder, Quotation } from "@/app/lib/models";
import { connectToDB } from "@/app/lib/utils";
import { NextResponse } from "next/server";

const sanitizeManualProducts = (products = []) => {
  if (!Array.isArray(products)) return [];
  return products
    .map((product) => {
      const qtyValue =
        product?.qty === '' || product?.qty === null || product?.qty === undefined
          ? null
          : Number(product.qty);
      const unitValue =
        product?.unit === '' || product?.unit === null || product?.unit === undefined
          ? null
          : Number(product.unit);
      const unitPriceValue =
        product?.unitPrice === '' || product?.unitPrice === null || product?.unitPrice === undefined
          ? null
          : Number(product.unitPrice);

      return {
        productCode: product?.productCode || '',
        description: product?.description || '',
        qty: Number.isFinite(qtyValue) ? qtyValue : null,
        unit: Number.isFinite(unitValue) ? unitValue : null,
        unitPrice: Number.isFinite(unitPriceValue)
          ? unitPriceValue
          : qtyValue !== null && unitValue !== null
          ? qtyValue * unitValue
          : null,
      };
    })
    .filter(
      (product) =>
        product.productCode ||
        product.description ||
        product.qty !== null ||
        product.unit !== null ||
        product.unitPrice !== null
    );
};

export async function POST(req) {
  try {
    const {
      poNumber,
      poDate,
      clientId,
      quotationId,
      value,
      currency = 'USD',
      projectType = 'Supply',
      projectStatus = 'OPEN',
      manualProducts = [],
    } = await req.json();

    if (!clientId) {
      return NextResponse.json({ error: 'Client is required' }, { status: 400 });
    }

    const sanitizedPoNumber = typeof poNumber === 'string' ? poNumber.trim() : '';

    const baseValue = parseFloat(value);
    if (!value || Number.isNaN(baseValue)) {
      return NextResponse.json({ error: 'Invalid value' }, { status: 400 });
    }

    await connectToDB();

    const client = await Client.findById(clientId).lean();
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    let quotation = null;
    if (quotationId) {
      quotation = await Quotation.findById(quotationId).lean();
      if (!quotation || quotation.client.toString() !== client._id.toString()) {
        return NextResponse.json({ error: 'Quotation not found or does not belong to client' }, { status: 400 });
      }
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

    const valueWithVAT = currency === 'SAR'
      ? parseFloat((baseValue * 1.15).toFixed(2))
      : baseValue;
    const products = sanitizeManualProducts(manualProducts);

    if (!quotation && products.length === 0) {
      return NextResponse.json(
        { error: 'Provide at least one manual product or select a quotation' },
        { status: 400 }
      );
    }

    const jobOrder = new JobOrder({
      jobOrderId: customJobOrderId,
      poNumber: sanitizedPoNumber,
      poDate: poDate || null,
      client: client._id,
      quotation: quotation ? quotation._id : null,
      projectType,
      projectStatus,
      baseValue: currency === 'SAR' ? baseValue : 0,
      value: valueWithVAT,
      currency,
      remainingAmount: valueWithVAT,
      products,
    });

    await jobOrder.save();

    return NextResponse.json({ success: true, jobOrder });
  } catch (error) {
    console.error('Error creating job order:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
