const DEFAULT_PLACEHOLDER = "—";
const BULLET_PREFIX = /^[•●▪·‣⁃*\-–—]+\s*/;
const CLAUSE_FIELDS = [
  { key: "PaymentTerm", aliases: ["paymentTerm"] },
  { key: "PaymentDelivery", aliases: ["paymentDelivery", "deliveryTerm"] },
  { key: "ValidityPeriod", aliases: ["validityPeriod"] },
  { key: "DelayPenalties", aliases: ["delayPenalties"] },
  { key: "SellingPolicy", aliases: ["sellingPolicy"] },
  { key: "DeliveryLocation", aliases: ["deliveryLocation"] },
];

function hasValue(value) {
  return value !== null && value !== undefined && value !== "";
}

function formatDecimal(value) {
  if (!hasValue(value)) return "";
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(2) : String(value);
}

export function wrapPurchaseDescription(text = "", maxLen = 55) {
  if (!text) return [DEFAULT_PLACEHOLDER];

  const normalized = String(text)
    .replace(/<\/p>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\r\n?/g, "\n");

  const segments = normalized
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const lines = [];
  segments.forEach((segment) => {
    let working = segment;
    while (working.length > maxLen) {
      let cut = working.lastIndexOf(" ", maxLen);
      if (cut < maxLen * 0.6) cut = maxLen;
      lines.push(working.slice(0, cut).trim());
      working = working.slice(cut).trim();
    }
    if (working) lines.push(working);
  });

  return lines.length ? lines : [DEFAULT_PLACEHOLDER];
}

function splitClauseLines(value) {
  if (!hasValue(value)) return [];
  const normalized = String(value)
    .replace(/\r\n?/g, "\n")
    .replace(/\t/g, " ")
    .trim();
  if (!normalized) return [];

  const rawLines = normalized
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const lines = [];
  rawLines.forEach((line) => {
    const cleaned = line.replace(BULLET_PREFIX, "").trim();
    if (cleaned) {
      lines.push(cleaned);
    }
  });

  return lines.length ? lines : [normalized];
}

function formatClauseFromLines(lines = []) {
  if (!lines || lines.length === 0) return "";
  const useBullets = lines.length > 1;
  return lines
    .map((line) => (useBullets ? `• ${line}` : line))
    .join("\n");
}

function applyClauseFormatting(payload) {
  CLAUSE_FIELDS.forEach(({ key, aliases = [] }) => {
    const lookupKeys = [key, ...aliases];
    const sourceKey = lookupKeys.find((name) => hasValue(payload[name]));
    if (!sourceKey) return;

    const lines = splitClauseLines(payload[sourceKey]);
    if (!lines.length) return;

    const formatted = formatClauseFromLines(lines);
    payload[key] = formatted;
    payload[`${key}Lines`] = lines;

    aliases.forEach((alias) => {
      if (alias in payload) {
        payload[alias] = formatted;
      }
    });
  });
}

export function normalizePurchaseItem(row = {}, index = 0) {
  const qty = hasValue(row.Qty) ? row.Qty : row.qty;
  const unitRaw = hasValue(row.Unit) ? row.Unit : row.unit;
  const unitPriceRaw = hasValue(row.UnitPrice)
    ? row.UnitPrice
    : row.unitPrice;

  const fallbackSubtotal =
    hasValue(unitPriceRaw) || !hasValue(qty) || !hasValue(unitRaw)
      ? unitPriceRaw
      : Number(qty) * Number(unitRaw);

  let descriptionRich = [];
  if (Array.isArray(row.DescriptionRich) && row.DescriptionRich.length) {
    descriptionRich = row.DescriptionRich.map((line) => String(line).trim()).filter(Boolean);
  } else {
    descriptionRich = wrapPurchaseDescription(row.Description || row.description || "");
  }

  if (!descriptionRich.length) {
    descriptionRich = [DEFAULT_PLACEHOLDER];
  }

  const numberValue = row.Number && String(row.Number).trim()
    ? String(row.Number).trim()
    : String(index + 1).padStart(3, "0");

  return {
    Number: numberValue,
    ProductCode: row.ProductCode || row.productCode || "",
    Description: row.Description || row.description || "",
    DescriptionRich: descriptionRich,
    Qty: hasValue(qty) ? qty : "",
    Unit: formatDecimal(unitRaw),
    UnitPrice: formatDecimal(fallbackSubtotal),
  };
}

export function buildPurchaseSectionsFromRows(rows = [], options = {}) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const title = options.title?.trim?.() || "";
  const items = rows.map((row, idx) => normalizePurchaseItem(row, idx));
  return [
    {
      Title: title,
      TitleRow: title ? [{ Title: title }] : [],
      Items: items,
    },
  ];
}

export function flattenPurchaseSections(sections = []) {
  if (!Array.isArray(sections)) return [];
  return sections.flatMap((section) =>
    Array.isArray(section?.Items) ? section.Items : []
  );
}

export function ensurePurchaseDocSections(payload = {}) {
  if (!payload) return payload;

  if (Array.isArray(payload.Sections) && payload.Sections.length) {
    payload.Sections = payload.Sections.map((section) => {
      const title = section?.Title?.trim?.() || "";
      const rawItems =
        (Array.isArray(section?.Items) && section.Items.length
          ? section.Items
          : Array.isArray(section?.items)
          ? section.items
          : []) || [];

      return {
        Title: title,
        TitleRow: title ? [{ Title: title }] : [],
        Items: rawItems.map((item, idx) => normalizePurchaseItem(item, idx)),
      };
    });
  } else {
    const rows =
      (Array.isArray(payload.Products) && payload.Products.length
        ? payload.Products
        : Array.isArray(payload.products)
        ? payload.products
        : []) || [];

    payload.Sections = buildPurchaseSectionsFromRows(rows);
  }

  applyClauseFormatting(payload);
  return payload;
}
