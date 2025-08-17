import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";

// 1) Load from your new path
function loadTemplateBytes() {
  const file = path.join(process.cwd(), "templates", "SVS_Quotation_NEW.pdf");
  return fs.readFileSync(file);
}

// helpers
const fmt = (n) =>
  Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export async function generateQuotationPdf(payload) {
  const tplBytes = loadTemplateBytes();
  const pdfDoc = await PDFDocument.load(tplBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  let page = pdfDoc.getPages()[0];

  const draw = (t, x, y, size = 10, f = font) =>
    page.drawText(String(t ?? ""), { x, y, size, font: f, color: rgb(0, 0, 0) });

  const drawRight = (t, xRight, y, size = 10, f = font) => {
    const str = String(t ?? "");
    const w = f.widthOfTextAtSize(str, size);
    page.drawText(str, { x: xRight - w, y, size, font: f, color: rgb(0, 0, 0) });
  };

  // Header
  draw(`Quotation #: ${payload.QuotationNumber}`, 40, 760, 12, bold);
  draw(`Date: ${payload.CreatedAt}`, 420, 760, 12);

  // Parties
  draw(`Client: ${payload.ClientName}`, 40, 735);
  draw(`Project: ${payload.ProjectName}`, 40, 720);
  draw(`Location: ${payload.ProjectLA}`, 40, 705);
  draw(`Sales Rep: ${payload.SaleName}`, 40, 690);

  draw(`Client Contact: ${payload.ClientContactName}`, 320, 735);
  draw(`Client Phone: ${payload.ClientPhone}`, 320, 720);
  draw(`Client Email: ${payload.ClientEmail}`, 320, 705);
  draw(`Client Address: ${payload.ClientAddress}`, 320, 690);

  draw(`User: ${payload.userName}`, 40, 675);
  draw(`User Phone: ${payload.UserPhone}`, 40, 660);
  draw(`User Email: ${payload.UserEmail}`, 320, 660);
  draw(`User Address: ${payload.UserAddress}`, 320, 645);

  // Table
  let y = 615;
  const startX = 40;
  const col = { no: 40, code: 90, desc: 240, qty: 50, unit: 70, price: 90 };
  const x = [
    startX,
    startX + col.no,
    startX + col.no + col.code,
    startX + col.no + col.code + col.desc,
    startX + col.no + col.code + col.desc + col.qty,
    startX + col.no + col.code + col.desc + col.qty + col.unit,
  ];
  const right = {
    qty: x[3] + col.qty,
    unit: x[4] + col.unit,
    total: x[5] + col.price,
  };

  ["No", "Code", "Description", "Qty", "Unit Price", "Total"].forEach((h, i) =>
    draw(h, x[i], y, 10, bold)
  );
  y -= 12;

  const currency = payload.Currency || "USD";
  const bottomMargin = 110;

  // simple character wrap for description (fine for now)
  const wrap = (text, maxChars) => {
    const words = String(text || "").split(/\s+/);
    const lines = [];
    let line = "";
    for (const w of words) {
      const n = line ? line + " " + w : w;
      if (n.length <= maxChars) line = n;
      else { if (line) lines.push(line); line = w; }
    }
    if (line) lines.push(line);
    return lines;
  };

  for (const p of payload.Products || []) {
    const descLines = wrap(p.Description, 42);
    const rowH = 12 * Math.max(1, descLines.length) + 4;

    if (y - rowH < bottomMargin) {
      page = pdfDoc.addPage();
      ["No", "Code", "Description", "Qty", "Unit Price", "Total"].forEach((h, i) =>
        page.drawText(h, { x: x[i], y: 780, size: 10, font: bold })
      );
      y = 768;
    }

    draw(p.Number ?? "", x[0], y);
    draw(p.ProductCode ?? "", x[1], y);

    // description
    let dy = 0;
    for (const line of descLines) {
      draw(line, x[2], y - dy);
      dy += 12;
    }

    const qty = Number(p.Qty || 0);
    const unitPrice = p.Unit != null ? Number(p.Unit) : 0;     // per-unit price
    const total = p.UnitPrice != null ? Number(p.UnitPrice) : unitPrice * qty;

    drawRight(`${qty}`, right.qty - 2, y);
    drawRight(`${currency} ${fmt(unitPrice)}`, right.unit - 2, y);
    drawRight(`${currency} ${fmt(total)}`, right.total - 2, y);

    y -= rowH;
  }

  // Totals — mask the template placeholders, then draw our numbers
  // (tweak the rectangle position/size if needed to cover "TOTAL PRICE () / VAT {...} ()")
  page.drawRectangle({ x: 360, y: y - 8, width: 200, height: 60, color: rgb(1, 1, 1) });

  y -= 12;
  drawRight(`Subtotal: ${currency} ${payload.TotalPrice}`, 540, y, 11);
  y -= 14;
  const vatLabel = currency === "USD" ? "0%" : "15%";
  drawRight(`VAT (${vatLabel}): ${currency} ${payload.VatPrice}`, 540, y, 11);
  y -= 14;
  drawRight(`Total: ${currency} ${payload.NetPrice}`, 540, y, 11, bold);

  // Terms / notes
  y -= 24;
  draw("Validity:", 40, y);
  wrap(payload.ValidityPeriod, 95).forEach((l, i) => draw(l, 110, y - i * 12));
  y -= wrap(payload.ValidityPeriod, 95).length * 12 + 6;

  draw("Payment Term:", 40, y);
  wrap(payload.PaymentTerm, 95).forEach((l, i) => draw(l, 140, y - i * 12));
  y -= wrap(payload.PaymentTerm, 95).length * 12 + 6;

  draw("Delivery:", 40, y);
  wrap(payload.PaymentDelivery, 95).forEach((l, i) => draw(l, 110, y - i * 12));
  y -= wrap(payload.PaymentDelivery, 95).length * 12 + 6;

  draw("Notes:", 40, y);
  wrap(payload.Note, 120).forEach((l, i) => draw(l, 95, y - i * 12));
  y -= wrap(payload.Note, 120).length * 12 + 6;

  draw("Excluding:", 40, y);
  wrap(payload.Excluding, 120).forEach((l, i) => draw(l, 115, y - i * 12));

  return await pdfDoc.save();
}
