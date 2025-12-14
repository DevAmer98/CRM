import { UNIT_MERGE_CONT_TOKEN, UNIT_MERGE_START_TOKEN } from "./sharedPriceTokens"
import { richTextToPlainText } from "./richTextUtils"

export function buildQuotationPayload(q) {
  if (!q) throw new Error("No quotation found");

  // format numbers with 2 decimals
  const fmt = (n) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(n || 0));

  // Split description on newlines and also on separators (., -, _),
  // but KEEP the separator at the beginning of the new line.
  // Then soft-wrap to ~40 chars. Do NOT strip leading punctuation.
  function wrapDesc(text, maxLen = 40) {
    if (!text) return ["—"];

    // normalize CRLF
    const normalized = String(text).replace(/\r\n?/g, "\n");

    // Insert line breaks *before* any lone separator we want to break on,
    // keeping the separator (e.g. "foo - bar" -> "foo\n- bar").
    // Also works if the line already starts with "-" or "." — we keep it.
    const prepared = normalized.replace(/\s*([.\-_])\s*/g, "\n$1 ");

    // split to lines, trim, drop empties
    const raw = prepared
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);

    // soft wrap to ~40 chars per line
    const out = [];
    for (const line of raw) {
      let s = line; // keep any leading "-" or "."
      while (s.length > maxLen) {
        let cut = s.lastIndexOf(" ", maxLen);
        if (cut < Math.floor(maxLen * 0.6)) cut = maxLen; // hard break if no space nearby
        out.push(s.slice(0, cut).toUpperCase());
        s = s.slice(cut).trim();
      }
      if (s) out.push(s.toUpperCase());
    }

    return out.length ? out : ["—"];
  }

  // Build Sections/Items
  const Sections = [];
  const sharedGroupTracker = new Map();
  let current = null;
  let lastTitle = "";
  let globalRowCounter = 0;

  (q.products || []).forEach((p) => {
    const title = (p.titleAbove || "").trim();

    // Start a new section when a NEW title appears
    if (title && title !== lastTitle) {
      current = { Title: title, TitleRow: [{ Title: title }], Items: [], __counter: 0 };
      Sections.push(current);
      lastTitle = title;
    }

    // First rows before any title -> default no-title section
    if (!current) {
      current = { Title: "", TitleRow: [], Items: [], __counter: 0 };
      Sections.push(current);
    }

    current.__counter += 1;
    globalRowCounter += 1;

    const qty = Number(p.qty || 0);
    const unit = Number(p.unit || 0);
    const rowSubtotal = p.unitPrice != null ? Number(p.unitPrice) : unit * qty;

    const cleanDescription = richTextToPlainText(p.description || "");
    const lines = wrapDesc(cleanDescription);

    const sharedGroupId = (p.sharedGroupId || "").trim();
    const sharedGroupPrice =
      p.sharedGroupPrice != null ? Number(p.sharedGroupPrice) : undefined;
    const hasSharedPrice =
      !!sharedGroupId && Number.isFinite(sharedGroupPrice);
    const seenCount = hasSharedPrice
      ? sharedGroupTracker.get(sharedGroupId) || 0
      : 0;
    const isFirstSharedRow = hasSharedPrice && seenCount === 0;
    if (hasSharedPrice) {
      sharedGroupTracker.set(sharedGroupId, seenCount + 1);
    }

    const unitDisplay = hasSharedPrice
      ? isFirstSharedRow
        ? `${fmt(sharedGroupPrice)}${UNIT_MERGE_START_TOKEN}`
        : UNIT_MERGE_CONT_TOKEN
      : fmt(unit);
    const subtotalDisplay = hasSharedPrice
      ? isFirstSharedRow
        ? `${fmt(rowSubtotal)}${UNIT_MERGE_START_TOKEN}`
        : UNIT_MERGE_CONT_TOKEN
      : fmt(rowSubtotal);

    current.Items.push({
      Number: String(globalRowCounter).padStart(3, "0"),
      ProductCode: (p.productCode || "—").toUpperCase(),

      // Use this token in the DOCX description cell
      DescriptionLines: lines.join("\n"),

      // Optional extras (kept if you ever switch to looping)
      DescriptionRich: lines,
      Description: (cleanDescription || "—").toUpperCase(),

      Qty: qty,
      Unit: unitDisplay,
      UnitPrice: subtotalDisplay,
    });
  });

  // Totals
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
    ? {
        CurrencyWrap: "(USD)",
        CurrencyNote: "All prices in USD",
        CurrencySymbol: "$",
        IsSAR: false,
        IsUSD: true,
      }
    : {
        CurrencyWrap: "",
        CurrencyNote: "",
        CurrencySymbol: "",
        IsSAR: true,
        IsUSD: false,
      };

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

    Sections, // description uses {DescriptionLines} in the DOCX
  };
}
