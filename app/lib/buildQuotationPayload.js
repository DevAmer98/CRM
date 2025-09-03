
export function buildQuotationPayload(quotation) {
  if (!quotation) throw new Error("No quotation found");

  const rows = (quotation.products || []).map((product, idx) => {
    const unit = Number(product.unit || 0);
    const qty = Number(product.qty || 0);
    const unitPrice = unit * qty;
    return {
      Number: String(idx + 1).padStart(3, "0"),
      ProductCode: (product.productCode || "—").toUpperCase(),
      UnitPrice: unitPrice.toFixed(2),
      Unit: unit.toString(),
      Qty: qty,
      Description:
        (product.description || "—").toUpperCase().match(/.{1,40}/g) || ["—"],
    };
  });

  const subtotal = rows.reduce(
    (acc, r) => acc + parseFloat(r.UnitPrice || 0),
    0
  );
  const vatRate = quotation.currency === "USD" ? 0 : 15;
  const vatAmount = subtotal * vatRate / 100;
  const total = subtotal + vatAmount;
     
 
  return {
      Currency: quotation.currency || "USD",
      ClientAddress: quotation.client?.address || "No Client Address",
      QuotationNumber: quotation.quotationId || "No Quotation ID",
      ClientName:quotation.client?.name|| "No Client Name",

      CreatedAt: new Date(quotation.createdAt || Date.now()).toISOString().split("T")[0],
      ProjectName: quotation.projectName || "No Project Name",
      ProjectLA: quotation.projectLA || "No Project Location Address",
      SaleName: quotation.sale?.name || "No Sales Representative Name",
      ClientContactName: quotation.client?.contactName || "No Client Contact Name",
      userName: quotation.user?.username || "No User Name",
      ClientPhone: quotation.client?.phone || "No Client Phone",
      UserPhone: quotation.sale?.phone || "No Sales Representative Phone",
      UserEmail: quotation.sale?.email || "No Sales Representative Email",
      UserAddress: quotation.sale?.address || "No Sales Representative Address",
      ClientContactMobile: quotation.client?.contactMobile || "No Client Contact Mobile",
      ClientEmail: quotation.client?.email || "No Client Email",


    // numbers
    TotalPrice: subtotal.toFixed(2),
    VatRate: vatRate,
    VatPrice: vatAmount.toFixed(2),
    NetPrice: total.toFixed(2),

    Products: rows,

    ValidityPeriod: quotation.validityPeriod || "",
    PaymentTerm: quotation.paymentTerm || "",
    PaymentDelivery: quotation.paymentDelivery || "",
    Note: quotation.note || "",
    Excluding: quotation.excluding || "",
  };
}
