export function buildQuotationPayload(q) {
  if (!q) throw new Error("No quotation found");

  const fmt = (n) =>
    new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      .format(Number(n || 0));

  const wrap = (s) => ((s || "—").toUpperCase().match(/.{1,40}/g)) || ["—"];

  const Sections = [];
  let current = null;
  let lastTitle = "";

  (q.products || []).forEach((p) => {
    const title = (p.titleAbove || "").trim();

    // Start a new section when a NEW title appears
    if (title && title !== lastTitle) {
      current = { Title: title, TitleRow: [{ Title: title }], Items: [], __counter: 0 };
      Sections.push(current);
      lastTitle = title;
    }

    // First rows before any title -> default no-title section (title row must vanish)
    if (!current) {
      current = { Title: "", TitleRow: [], Items: [], __counter: 0 };
      Sections.push(current);
    }

    current.__counter += 1;

    const qty = Number(p.qty || 0);
    const unit = Number(p.unit || 0);
    const rowSubtotal = p.unitPrice != null ? Number(p.unitPrice) : unit * qty;

    current.Items.push({
      Number: String(current.__counter).padStart(3, "0"),
      ProductCode: (p.productCode || "—").toUpperCase(),
      DescriptionRich: wrap(p.description),
      Description: (p.description || "—").toUpperCase(),
      Qty: qty,
      Unit: fmt(unit),
      UnitPrice: fmt(rowSubtotal),
    });
  });

  const subtotal = (q.products || []).reduce((sum, p) => {
    const qty = Number(p.qty || 0);
    const unit = Number(p.unit || 0);
    const row = p.unitPrice != null ? Number(p.unitPrice) : unit * qty;
    return sum + (Number.isFinite(row) ? row : 0);
  }, 0);

  const isUSD = (q.currency || "USD") === "USD";
  const vatRate = isUSD ? 0 : 15;
  const vatAmount = subtotal * (isUSD ? 0 : 0.15);
  const total = subtotal + vatAmount;

  const cf = isUSD
    ? { CurrencyWrap: "(USD)", CurrencyNote: "All prices in USD", CurrencySymbol: "$", IsSAR: false, IsUSD: true }
    : { CurrencyWrap: "",       CurrencyNote: "",                 CurrencySymbol: "",  IsSAR: true,  IsUSD: false };

  return {
    templateId: "quotation-v1",

    QuotationNumber: q.quotationId || "—",
    ClientName: q.client?.name || "—",
    CreatedAt: (q.createdAt ? new Date(q.createdAt) : new Date()).toISOString().slice(0, 10),
    ProjectName: q.projectName || "—",
    ProjectLA: q.projectLA || "—",
    SaleName: q.sale?.name || "—",
    ClientContactName: q.client?.contactName || "—",
    userName: q.user?.username || "—",
    ClientPhone: q.client?.phone || "—",
    UserPhone: q.sale?.phone || "—",
    UserEmail: q.sale?.email || "—",
    UserAddress: q.sale?.address || "—",
    ClientContactMobile: q.client?.contactMobile || "—",
    ClientEmail: q.client?.email || "—",
    ClientAddress: q.client?.address || "—",

    Currency: q.currency || "USD",
    TotalPrice: fmt(subtotal),
    VatRate: vatRate,
    VatPrice: fmt(vatAmount),
    NetPrice: fmt(total),

    ValidityPeriod: q.validityPeriod || "—",
    PaymentTerm: q.paymentTerm || "—",
    PaymentDelivery: q.paymentDelivery || "—",
    Note: q.note || "—",
    Excluding: q.excluding || "—",

    ...cf,

    Sections,  // <- the DOCX loops this
  };
}
