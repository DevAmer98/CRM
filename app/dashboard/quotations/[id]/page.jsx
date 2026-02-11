//app/dashboard/quotations/%5Bid%5D/page.jsx
"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { FaPlus, FaTrash, FaTag, FaEdit, FaGripLines, FaUnlink } from "react-icons/fa";
import styles from "@/app/ui/dashboard/approve/approve.module.css";
import { editQuotation, updateQuotation } from "@/app/lib/actions";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import {
  UNIT_MERGE_CONT_TOKEN,
  UNIT_MERGE_START_TOKEN,
} from "@/app/lib/sharedPriceTokens";
import { decodeHtmlEntities } from "@/app/lib/richTextUtils";

const COMPANY_OPTIONS = [
  { value: "SMART_VISION", label: "Smart Vision" },
  { value: "ARABIC_LINE", label: "ArabicLine" },
];
const UNIT_OPTIONS = ["m", "m2", "m3", "PCS", "LM", "L/S", "Roll", "EA", "Trip"];
const buildRow = (overrides = {}) => ({
  id: 0,
  number: 0,
  productCode: "",
  description: "",
  qty: "",
  unit: "",
  discount: 0,
  unitPrice: 0,
  unitType: "",
  isSubtitleOnly: false,
  titleAbove: "",
  subtitleAbove: "",
  sharedGroupId: null,
  sharedGroupPrice: null,
  ...overrides,
});

const SingleQuotation = ({ params }) => {
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [quotation, setQuotation] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setLoading] = useState(true);
  // --- NEW: description popup state ---
const [isDescPopupOpen, setIsDescPopupOpen] = useState(false);
const [activeDescIndex, setActiveDescIndex] = useState(null);
const [richDescValue, setRichDescValue] = useState("");
  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsError, setClientsError] = useState(null);
  const [sales, setSales] = useState([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesError, setSalesError] = useState(null);


  const [formData, setFormData] = useState({
    clientId: "",
    clientName: "",
    saleId: "",
    saleName: "",
    projectName: "",
    projectLA: "",
    products: [],
    paymentTerm: "",
    paymentDelivery: "",
    validityPeriod: "",
    note: "",
    excluding: "",
        warranty: "",
    totalPrice: "",
    totalDiscount: 0, // NEW: subtotal discount %
    totalDiscountType: "PERCENT",
    companyProfile: "SMART_VISION",
  });

  // table rows + title toggles
  const [rows, setRows] = useState([]);
  const [showTitles, setShowTitles] = useState([]);
  const [showSubtitles, setShowSubtitles] = useState([]);
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [sharedPriceValue, setSharedPriceValue] = useState("");
  const [uploadedExcelName, setUploadedExcelName] = useState("");
  const excelInputRef = useRef(null);

  const currencyFields = (selectedCurrency) => {
    const isSAR = selectedCurrency === "SAR";
    return {
      isSAR,
      Currency: isSAR ? "" : "(USD)",
      CurrencySymbol: isSAR ? "" : "$",
      CurrencyWrap: isSAR ? "" : "(USD)",
      CurrencyNote: isSAR ? "" : "All prices in USD",
    };
  };

  // Preview state (popup)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isOnlyOfficeOpen, setIsOnlyOfficeOpen] = useState(false);
  const onlyOfficeUrl =
    process.env.NEXT_PUBLIC_ONLYOFFICE_URL || "http://localhost:8080";
  const [synologyUploading, setSynologyUploading] = useState(false);
  const [synologyStatus, setSynologyStatus] = useState("");

  // ---------- helpers ----------
  const clampPct = (n) => Math.min(Math.max(Number(n || 0), 0), 100); // NEW
  const toNumber = (value) => {
    const num = Number(String(value ?? "").replace(/[^\d.]/g, ""));
    return Number.isFinite(num) ? num : 0;
  };

  const formatCurrency = (value) => {
    const n = Number(value || 0);
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  };

  const stripHtml = (html) => html.replace(/<[^>]*>?/gm, "").trim();

  const sharedGroupMeta = useMemo(() => {
    const palette = ["#0ea5e9", "#f97316", "#a855f7", "#22c55e", "#ec4899", "#facc15"];
    const meta = {};
    let colorIndex = 0;
    rows.forEach((row) => {
      if (!row.sharedGroupId) return;
      if (!meta[row.sharedGroupId]) {
        meta[row.sharedGroupId] = {
          count: 0,
          price:
            row.sharedGroupPrice !== null && row.sharedGroupPrice !== undefined
              ? Number(row.sharedGroupPrice)
              : undefined,
          color: palette[colorIndex % palette.length],
          label: `Group ${String.fromCharCode(65 + (colorIndex % 26))}`,
        };
        colorIndex += 1;
      }
      meta[row.sharedGroupId].count += 1;
      if (
        row.sharedGroupPrice !== null &&
        row.sharedGroupPrice !== undefined &&
        Number.isFinite(Number(row.sharedGroupPrice))
      ) {
        meta[row.sharedGroupId].price = Number(row.sharedGroupPrice);
      }
    });
    return meta;
  }, [rows]);

  const activeClient = useMemo(() => {
    if (formData.clientId) {
      const match = clients.find((client) => client._id === formData.clientId);
      if (match) return match;
    }
    return quotation?.client || null;
  }, [clients, formData.clientId, quotation]);

  const activeSale = useMemo(() => {
    if (formData.saleId) {
      const match = sales.find((sale) => sale._id === formData.saleId);
      if (match) return match;
    }
    return quotation?.sale || null;
  }, [formData.saleId, sales, quotation]);

  const getRowLineTotal = (row) => {
    const discountPct = clampPct(row.discount);
    if (
      row.sharedGroupId &&
      row.sharedGroupPrice !== null &&
      row.sharedGroupPrice !== undefined
    ) {
      const base = Number(row.sharedGroupPrice) || 0;
      return base * (1 - discountPct / 100);
    }
    const qty = Number(row.qty || 0);
    const unit = Number(row.unit || 0);
    const base = qty * unit;
    return base * (1 - discountPct / 100);
  };

  const getSharedGroupKey = (row) => {
    const sharedGroupId = (row.sharedGroupId || "").trim();
    const sharedGroupPrice =
      row.sharedGroupPrice !== null && row.sharedGroupPrice !== undefined
        ? Number(row.sharedGroupPrice)
        : undefined;
    if (!sharedGroupId) return null;
    if (!Number.isFinite(sharedGroupPrice)) return null;
    return sharedGroupId;
  };

  // CHANGED: totals now include line discount and total discount
  const totals = useMemo(() => {
    // subtotal after per-line discounts
    const seenGroups = new Set();
    const subtotal = rows.reduce((acc, r) => {
      const sharedKey = getSharedGroupKey(r);
      if (sharedKey) {
        if (seenGroups.has(sharedKey)) return acc;
        seenGroups.add(sharedKey);
      }
      return acc + getRowLineTotal(r);
    }, 0);

    const discountType = formData.totalDiscountType || "PERCENT";
    const rawDiscount = formData.totalDiscount;
    const totalDiscPct =
      discountType === "AMOUNT"
        ? subtotal > 0
          ? (Math.min(Math.max(toNumber(rawDiscount), 0), subtotal) / subtotal) * 100
          : 0
        : clampPct(String(rawDiscount).replace("%", ""));
    const discountAmount =
      discountType === "AMOUNT"
        ? Math.min(Math.max(toNumber(rawDiscount), 0), subtotal)
        : subtotal * (totalDiscPct / 100);
    const subtotalAfterTotalDiscount = Math.max(0, subtotal - discountAmount); // NEW

    const vatRate = selectedCurrency === "USD" ? 0 : 0.15;
    const vatAmount = subtotalAfterTotalDiscount * vatRate; // NEW
    const total = subtotalAfterTotalDiscount + vatAmount;   // NEW

    return {
      subtotal: Number(subtotal.toFixed(2)),                                // NEW
      subtotalAfterTotalDiscount: Number(subtotalAfterTotalDiscount.toFixed(2)), // NEW
      discountAmount: Number(discountAmount.toFixed(2)),
      vatAmount: Number(vatAmount.toFixed(2)),
      totalUnitPriceWithVAT: Number(total.toFixed(2)),
      totalDiscountPct: totalDiscPct, // for display/debug if needed
    };
  }, [rows, selectedCurrency, formData.totalDiscount, formData.totalDiscountType]);

  // ---------- Build data for document preview/upload (SECTIONS) ----------
  const buildDocumentData = (mode = "word-to-pdf") => {
    const resolvedQuotationNumber =
      quotation?.quotationId || formData.quotationId || params.id || "";
    if (!rows || rows.length === 0) throw new Error("No product rows available.");
    if (!formData || !quotation) throw new Error("Missing required form data or quotation details.");

    const {
      subtotal: Subtotal,                            // NEW
      vatAmount: VatPrice,
      totalUnitPriceWithVAT: NetPrice,
      totalDiscountPct,
      subtotalAfterTotalDiscount,
    } = totals;
    const vatRate = selectedCurrency === "USD" ? 0 : 15;
    const cf = currencyFields(selectedCurrency);
    const companyProfile = formData.companyProfile || "SMART_VISION";
    const companyLabel =
      COMPANY_OPTIONS.find((opt) => opt.value === companyProfile)?.label || "Smart Vision";
    const templateIdMap = {
      SMART_VISION: "quotation-v1",
      ARABIC_LINE: "quotation-arabic-line",
    };
    const templateId = templateIdMap[companyProfile] || "quotation-v1";

function cleanHTML(input = "") {
  if (!input) return "";

  let output = decodeHtmlEntities(input);

  output = output
    // Normalize breaks and paragraphs
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n");

  // Handle <ol> ordered lists → "1. Item"
  output = output.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, listItems) => {
    let counter = 0;
    return listItems
      .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, item) => {
        counter++;
        const cleanItem = item.replace(/<[^>]+>/g, "").trim().replace(/\s+/g, " ");
        return `${counter}.  ${cleanItem}\n`;
      })
      .trim();
  });

  // Handle <ul> bullet lists → "· Item" (manual dot bullet for perfect alignment)
  output = output.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, listItems) => {
    return listItems
      .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, item) => {
        const cleanItem = item.replace(/<[^>]+>/g, "").trim().replace(/\s+/g, " ");
        return `·  ${cleanItem}\n`;
      })
      .trim();
  });

  // Strip all remaining tags (bold, spans, etc.)
  output = output
    .replace(/<\/?(strong|em|u|span|div|h\d|blockquote|a|b|i)[^>]*>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return output;
}



    // helper to split description on ". - _" used as separators AND wrap to ~40 chars
    function wrapDesc(text, maxLen = 40) {
      if (!text) return ["—"];
const normalized = cleanHTML(String(text)).replace(/\r\n?/g, "\n");


 const firstPass = normalized
   .split(/\n+/g) // only split on line breaks
   .map((s) => s.trim())
  .filter(Boolean);


  

      const out = [];
      for (const chunk of firstPass) {
        let s = chunk;
        while (s.length > maxLen) {
          let cut = s.lastIndexOf(" ", maxLen);
          if (cut < Math.floor(maxLen * 0.6)) cut = maxLen;
          out.push(s.slice(0, cut).toUpperCase());
          s = s.slice(cut).trim();
        }
        if (s) out.push(s.toUpperCase());
      }
      return out.length ? out : ["—"];
    }

    // Build Sections -> Items (title row printed only when Title exists)
    const Sections = [];
    const sharedGroupTracker = new Map();
    let currentSection = null;
    let lastTitle = "";
    let globalRowCounter = 0;
    let sectionCounter = 0;
    let subtitleCounter = 0;
    let itemCounter = 0;

    rows.forEach((r, globalIdx) => {
      // section boundary
      let startNew = false;
      let title = "";
      if (showTitles[globalIdx]) {
        const norm = (r.titleAbove || "").trim();
        if (norm && norm !== lastTitle) {
          startNew = true;
          title = norm;
          lastTitle = norm;
        }
      }
      if (startNew || !currentSection) {
        // A new title boundary should restart shared-price merges
        sharedGroupTracker.clear();
        if (startNew) {
          sectionCounter += 1;
          subtitleCounter = 0;
          itemCounter = 0;
        }
        const numberedTitle =
          startNew && sectionCounter > 0 ? `${sectionCounter} ${title}`.trim() : title;
        currentSection = {
          Title: numberedTitle,
          TitleRow: numberedTitle ? [{ Title: numberedTitle }] : [],
          Items: [],
          __counter: 0,
        };
        Sections.push(currentSection);
      }

      // line totals with discount
      const qty = Number(r.qty || 0);
      const unit = Number(r.unit || 0);
      const unitType = (r.unitType || "").trim();
      const rowSubtotal = getRowLineTotal(r);
      const subtitle = (r.subtitleAbove || "").trim();

      if (subtitle) {
        subtitleCounter += 1;
        itemCounter = 0;
        const subtitleNumber =
          sectionCounter > 0
            ? `${sectionCounter}.${subtitleCounter}`
            : String(subtitleCounter);
        currentSection.Items.push({
          Number: subtitleNumber,
          ProductCode: "",
          DescriptionRich: [subtitle.toUpperCase()],
          DescriptionLines: subtitle.toUpperCase(),
          Description: subtitle.toUpperCase(),
          Subtitle: subtitle,
          Qty: "",
          QtyDisplay: "",
          UnitType: "",
          Unit: "",
          UnitPrice: "",
        });
      }

      const hasLineContent =
        !!String(r.productCode || "").trim() ||
        !!String(r.description || "").trim() ||
        qty > 0 ||
        unit > 0 ||
        rowSubtotal > 0;
      if (r.isSubtitleOnly && !hasLineContent) {
        return;
      }

      // per-section hierarchical numbering
      currentSection.__counter += 1;
      globalRowCounter += 1;
      itemCounter += 1;
      const rowNumber =
        sectionCounter > 0
          ? subtitleCounter > 0
            ? `${sectionCounter}.${subtitleCounter}.${itemCounter}`
            : `${sectionCounter}.${itemCounter}`
          : String(globalRowCounter).padStart(3, "0");

      const sharedGroupId = (r.sharedGroupId || "").trim();
      const sharedGroupPrice =
        r.sharedGroupPrice !== null && r.sharedGroupPrice !== undefined
          ? Number(r.sharedGroupPrice)
          : undefined;
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
          ? `${formatCurrency(sharedGroupPrice)}${UNIT_MERGE_START_TOKEN}`
          : `${formatCurrency(sharedGroupPrice)}${UNIT_MERGE_CONT_TOKEN}`
        : formatCurrency(unit);
      const subtotalDisplay = hasSharedPrice
        ? isFirstSharedRow
          ? `${formatCurrency(rowSubtotal)}${UNIT_MERGE_START_TOKEN}`
          : `${formatCurrency(rowSubtotal)}${UNIT_MERGE_CONT_TOKEN}`
        : formatCurrency(rowSubtotal);
      const descLines = wrapDesc(r.description);

      const qtyDisplay = unitType ? `${qty} ${unitType}` : String(qty);
      currentSection.Items.push({
        Number: rowNumber,
        ProductCode: (r.productCode || "—").toUpperCase(),
        // Docx template expects an array for looping; keep a joined string too for single token use.
        DescriptionRich: descLines,
        DescriptionLines: descLines.join("\n"),
        Description: cleanHTML(r.description || "").toUpperCase(),
        Subtitle: (r.subtitleAbove || "").trim() || "—",


        Qty: qtyDisplay,
        QtyDisplay: qtyDisplay,
        UnitType: unitType,
        Unit: unitDisplay,
        UnitPrice: subtotalDisplay,
      });
    });

    const createdAt = new Date(
      quotation.updatedAt || quotation.createdAt || Date.now()
    );

const formattedDate = createdAt.toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "2-digit"
}).toUpperCase();

console.log(formattedDate);  // "NOVEMBER 09, 2025"


const formatReadableDate = (dateInput) => {
  return new Date(dateInput || Date.now())
    .toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "2-digit"
    })
    .toUpperCase();
};

const clientForDoc = activeClient || {};
const activeSaleForDoc = activeSale || {};
const requestedByForDoc = quotation?.requestedBy || {};


const payload = {
  renderMode: mode,
  templateId,

  QuotationNumber: String(resolvedQuotationNumber).toUpperCase(),
  AdminName: (
    quotation.user?.employee?.name ||
    quotation.user?.username ||
    formData.userName ||
    ""
  ).toUpperCase(),
 // AdminName: (formData.userName || "").toUpperCase(),
  ClientName: (formData.clientName || clientForDoc.name || "").toUpperCase(),
CreatedAt: formatReadableDate(quotation.updatedAt || quotation.createdAt),
  ProjectName: (formData.projectName || "").toUpperCase(),
  ProjectLA: (formData.projectLA || "").toUpperCase(),
  SaleName: (
    requestedByForDoc.name ||
    activeSaleForDoc.name ||
    ""
  ).toUpperCase(),
  RequesterName: (
    requestedByForDoc.name ||
    activeSaleForDoc.name ||
    ""
  ).toUpperCase(),
  ClientContactName: (clientForDoc.contactName || "").toUpperCase(),
  userName: (requestedByForDoc.name || "").toUpperCase(),
  ClientPhone: (clientForDoc.phone || "").toUpperCase(),
  UserPhone: (requestedByForDoc.phone || "").toUpperCase(),
  UserEmail: (requestedByForDoc.email || ""),
  UserAddress: (activeSaleForDoc.address || "").toUpperCase(),
  ClientContactMobile: (clientForDoc.contactMobile || "").toUpperCase(),
  ClientEmail: (clientForDoc.email || ""),
  ClientAddress: (clientForDoc.address || "").toUpperCase(),

  CompanyProfile: companyProfile,
  CompanyName: companyLabel.toUpperCase(),

  Currency: (selectedCurrency || "").toUpperCase(),

  TotalPrice: formatCurrency(Subtotal),
  TotalDiscountPct: totalDiscountPct,
  SubtotalAfterTotalDiscount: formatCurrency(subtotalAfterTotalDiscount),
  VatRate: vatRate,
  VatPrice: formatCurrency(VatPrice),
  NetPrice: formatCurrency(NetPrice),

  CurrencyWrap: (cf.CurrencyWrap || "").toUpperCase(),
  CurrencyNote: (cf.CurrencyNote || "").toUpperCase(),
  CurrencySymbol: (cf.CurrencySymbol || "").toUpperCase(),
  IsSAR: cf.isSAR,
  IsUSD: !cf.isSAR,

  TotalAfter: formatCurrency(subtotalAfterTotalDiscount),

  discountPer:
    totalDiscountPct > 0
      ? `${clampPct(totalDiscountPct)}%`
      : "0%",
  discountAmount:
    totalDiscountPct > 0
      ? formatCurrency(Subtotal - subtotalAfterTotalDiscount)
      : formatCurrency(0),

  ValidityPeriod: (formData.validityPeriod || "No Validity Period").toUpperCase(),
  PaymentTerm: (formData.paymentTerm || "No Payment Term").toUpperCase(),
  PaymentDelivery: (formData.paymentDelivery || "No Delivery Term").toUpperCase(),
  Note: formData.note && formData.note.trim() !== "" ? formData.note.toUpperCase() : undefined,
  Warranty: formData.warranty && formData.warranty.trim() !== "" ? formData.warranty.toUpperCase() : undefined,
  Excluding: formData.excluding && formData.excluding.trim() !== "" ? formData.excluding.toUpperCase() : undefined,


  Sections,
};

// DEBUG
console.groupCollapsed("[DOC DATA] buildDocumentData() – Sections");
payload.Sections.forEach((s, i) => {
  console.log(`Section ${i + 1} Title:`, s.Title || "(no title)");
  console.table(
    s.Items.map((p) => ({
      Number: p.Number,
      Code: p.ProductCode,
      Qty: p.Qty,
      Unit: p.Unit,
      Subtotal: p.UnitPrice,
      Lines: Array.isArray(p.DescriptionRich) ? p.DescriptionRich.length : 0,
    }))
  );
});
console.groupEnd();

return payload;
  };
  // ---------- data fetch ----------
  useEffect(() => {
    const getQuotationById = async () => {
      try {
        const res = await fetch(`/api/quotation/${params.id}`, {
          method: "GET",
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        console.groupCollapsed("[QUOTE] raw quotation from API");
        console.log(data);
        console.groupEnd();
        setQuotation(data);
      } catch (err) {
        setError(`Fetching failed: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    getQuotationById();
  }, [params.id]);

  useEffect(() => {
    const controller = new AbortController();
    const loadClientsAndSales = async () => {
      setClientsLoading(true);
      setSalesLoading(true);
      setClientsError(null);
      setSalesError(null);
      try {
        const [clientsRes, salesRes] = await Promise.all([
          fetch(`/api/allClients`, {
            method: "GET",
            signal: controller.signal,
          }),
          fetch(`/api/allSales`, {
            method: "GET",
            signal: controller.signal,
          }),
        ]);
        if (!clientsRes.ok) throw new Error(`Clients error: ${clientsRes.status}`);
        if (!salesRes.ok) throw new Error(`Sales error: ${salesRes.status}`);

        const [clientsData, salesData] = await Promise.all([
          clientsRes.json(),
          salesRes.json(),
        ]);

        setClients(Array.isArray(clientsData) ? clientsData : []);
        setSales(Array.isArray(salesData) ? salesData : []);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Failed to load clients or sales:", err);
        setClientsError("Failed to load clients");
        setSalesError("Failed to load sales");
        setClients([]);
        setSales([]);
      } finally {
        setClientsLoading(false);
        setSalesLoading(false);
      }
    };

    loadClientsAndSales();
    return () => controller.abort();
  }, []);

  // Load rows and dedupe titles so only the first of a same-title run shows the title input
  useEffect(() => {
    if (!quotation) return;

    setFormData({
      quotationId: quotation.quotationId,
      userName:
        quotation.user?.employee?.name ||
        quotation.user?.username ||
        "N/A",
      saleId: quotation.sale?._id?.toString?.() ?? "",
      saleName: quotation.sale?.name ?? "N/A",
      clientId:
        quotation.client?._id?.toString?.() ??
        (typeof quotation.client === "string" ? quotation.client : ""),
      clientName: quotation.client?.name ?? "N/A",
      projectName: quotation.projectName || "",
      projectLA: quotation.projectLA || "",
      products: quotation.products || [],
      paymentTerm: quotation.paymentTerm || "",
      paymentDelivery: quotation.paymentDelivery || "",
      validityPeriod: quotation.validityPeriod || "",
      note: quotation.note || "",
      warranty: quotation.warranty || "",
      excluding: quotation.excluding || "",
      totalPrice: quotation.totalPrice || "",
      totalDiscount: Number(quotation.totalDiscount || 0), // NEW
      totalDiscountType: "PERCENT",
      companyProfile: quotation.companyProfile || "SMART_VISION",
    });

    setSelectedCurrency(quotation.currency || "USD");

    const { newRows, initialShow, initialShowSubtitles } =
      buildRowsFromProducts(quotation.products || []);

    console.groupCollapsed("[ROWS] after transform");
    console.table(
      newRows.map((r) => ({
        number: r.number,
        code: r.productCode,
        qty: r.qty,
        unit: r.unit,
        discount: r.discount, // NEW
        unitPrice: r.unitPrice,
        titleAbove: r.titleAbove,
      }))
    );
    console.log("showTitles:", initialShow);
    console.groupEnd();

    setRows(newRows);
    setShowTitles(initialShow);
    setShowSubtitles(initialShowSubtitles);
    setSelectedRows([]);
  }, [quotation]);

  // ---------- table ops ----------
  const addRow = () => {
    const newRow = {
      id: rows.length + 1,
      number: rows.length + 1,
      productCode: "",
      description: "",
      qty: "",
      unit: "",
      discount: 0, // NEW
      unitPrice: 0,
      unitType: "",
      isSubtitleOnly: false,
      titleAbove: "",
      subtitleAbove: "",
      sharedGroupId: null,
      sharedGroupPrice: null,
    };
    setRows((prev) => [...prev, newRow]);
    setShowTitles((prev) => [...prev, false]);
    setShowSubtitles((prev) => [...prev, false]);
    setSelectedRows((prev) => prev.map((i) => i));
  };
  const addSubtitleRow = () => {
    const newRow = {
      id: rows.length + 1,
      number: rows.length + 1,
      productCode: "",
      description: "",
      qty: "",
      unit: "",
      discount: 0,
      unitPrice: 0,
      unitType: "",
      isSubtitleOnly: true,
      titleAbove: "",
      subtitleAbove: "",
      sharedGroupId: null,
      sharedGroupPrice: null,
    };
    setRows((prev) => [...prev, newRow]);
    setShowTitles((prev) => [...prev, false]);
    setShowSubtitles((prev) => [...prev, true]);
    setSelectedRows((prev) => prev.map((i) => i));
  };

  const deleteRow = (index) => {
    const updated = rows.filter((_, i) => i !== index);
    const renumbered = updated.map((r, i) => ({ ...r, id: i + 1, number: i + 1 }));
    setRows(renumbered);
    setShowTitles((prev) => prev.filter((_, i) => i !== index));
    setShowSubtitles((prev) => prev.filter((_, i) => i !== index));
    setSelectedRows((prev) => prev.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i)));
  };

  const moveRow = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    setRows((prevRows) => {
      const updated = [...prevRows];
      const [movedRow] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, movedRow);
      return updated.map((row, idx) => ({ ...row, id: idx + 1, number: idx + 1 }));
    });
    setShowTitles((prevShow) => {
      const updated = [...prevShow];
      const [movedFlag] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, movedFlag);
      return updated;
    });
    setShowSubtitles((prevShow) => {
      const updated = [...prevShow];
      const [movedFlag] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, movedFlag);
      return updated;
    });
    setSelectedRows((prevSelected) =>
      prevSelected
        .map((i) => {
          if (i === fromIndex) return toIndex;
          if (fromIndex < toIndex && i > fromIndex && i <= toIndex) return i - 1;
          if (fromIndex > toIndex && i >= toIndex && i < fromIndex) return i + 1;
          return i;
        })
        .filter((i) => i >= 0)
    );
  };

  const handleDragStartRow = (event, index) => {
    setDraggingIndex(index);
    if (event?.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(index));
    }
  };

  const handleDropOnRow = (event, index) => {
    event.preventDefault();
    const fromIndexRaw =
      draggingIndex !== null
        ? draggingIndex
        : Number(event?.dataTransfer?.getData("text/plain"));
    if (!Number.isFinite(fromIndexRaw) || fromIndexRaw === index) {
      setDraggingIndex(null);
      return;
    }
    moveRow(fromIndexRaw, index);
    setDraggingIndex(null);
  };

  const handleDragEndRow = () => {
    setDraggingIndex(null);
  };

  const toggleTitleForRow = (index) => {
    setShowTitles((prev) => prev.map((v, i) => (i === index ? !v : v)));
  };
  const toggleSubtitleForRow = (index) => {
    setShowSubtitles((prev) => prev.map((v, i) => (i === index ? !v : v)));
  };

  const toggleRowSelection = (index) => {
    setSelectedRows((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const clearRowSelection = () => setSelectedRows([]);

  const removeSharedPriceFromRow = (index) => {
    setRows((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              sharedGroupId: null,
              sharedGroupPrice: null,
              unitPrice: getRowLineTotal({ ...row, sharedGroupId: null, sharedGroupPrice: null }),
            }
          : row
      )
    );
  };

  const applySharedPriceToSelection = () => {
    const uniqueIndexes = Array.from(new Set(selectedRows));
    if (uniqueIndexes.length < 2) {
      alert("Select at least two products to apply a shared price.");
      return;
    }
    const numericPrice = Number(sharedPriceValue);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      alert("Enter a valid shared price greater than 0.");
      return;
    }
    const normalizedPrice = Number(numericPrice.toFixed(2));
    const groupId = `grp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const indexSet = new Set(uniqueIndexes);
    setRows((prev) =>
      prev.map((row, idx) =>
        indexSet.has(idx)
          ? {
              ...row,
              sharedGroupId: groupId,
              sharedGroupPrice: normalizedPrice,
              unitPrice: getRowLineTotal({
                ...row,
                sharedGroupId: groupId,
                sharedGroupPrice: normalizedPrice,
              }),
            }
          : row
      )
    );
    setSharedPriceValue("");
    setSelectedRows([]);
  };


  const handleRowInputChange = (index, fieldName, value) => {
  const numericFields = ["qty", "unit", "discount"];
  const clean = numericFields.includes(fieldName)
    ? String(value).replace(/[^\d.]/g, "")
    : fieldName === "productCode" && typeof value === "string"
    ? value.toUpperCase()
    : value;

  setRows((prev) =>
    prev.map((row, i) => {
      if (i !== index) return row;
      const next = { ...row, [fieldName]: clean };

      // recompute totals
      const qty = Number(fieldName === "qty" ? clean : row.qty || 0);
      const unit = Number(fieldName === "unit" ? clean : row.unit || 0);
      const disc =
        fieldName === "discount" ? clampPct(clean) : clampPct(row.discount);

      next.discount = disc;
      next.unitPrice = getRowLineTotal(next);

      return next;
    })
  );
};

  const buildRowsFromProducts = (products = []) => {
    const newRows = [];
    const initialShow = [];
    const initialShowSubtitles = [];
    let prev = undefined;

    products.forEach((product, index) => {
      const norm = (product.titleAbove || "").trim();
      const isBoundary = !!norm && norm !== prev;

      newRows.push({
        _id: product._id,
        id: index + 1,
        number: index + 1,
        productCode: product.productCode || "",
        unitPrice: Number(product.unitPrice || 0),
        unit: product.unit || "",
        unitType: product.unitType || "",
        isSubtitleOnly: Boolean(product.isSubtitleOnly),
        qty: product.qty || "",
        description: product.description || "",
        titleAbove: isBoundary ? norm : "",
        subtitleAbove: product.subtitleAbove || "",
        discount: Number(product.discount || 0),
        sharedGroupId: product.sharedGroupId || null,
        sharedGroupPrice:
          product.sharedGroupPrice !== undefined &&
          product.sharedGroupPrice !== null
            ? Number(product.sharedGroupPrice)
            : null,
      });

      initialShow.push(isBoundary);
      initialShowSubtitles.push(!!(product.subtitleAbove || "").trim());
      if (isBoundary) prev = norm;
    });

    return { newRows, initialShow, initialShowSubtitles };
  };

  const handleExcelUpload = (file) => {
    if (!file) {
      toast.error("Please select a file.");
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const products = [];
        let parsedSheets = 0;

        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

          const headerIndex = rows.findIndex((r) => {
            const text = r.join(" ").toLowerCase();
            const hasDesc = text.includes("description") || text.includes("product");
            const hasQty = text.includes("qty") || text.includes("quantity");
            const hasPrice =
              text.includes("sub-total") ||
              text.includes("subtotal") ||
              text.includes("rate") ||
              text.includes("price") ||
              text.includes("amount") ||
              text.includes("unit");
            return hasDesc && hasQty && hasPrice;
          });
          if (headerIndex === -1) continue;

          const header = rows[headerIndex].map((h) =>
            h.toString().toLowerCase().trim()
          );
          const colIndex = {
            itemNo: header.findIndex((h) => h.includes("item")),
            productCode: header.findIndex((h) => h.includes("product") || h.includes("code")),
            description: header.findIndex((h) => h.includes("description")),
            qty: header.findIndex((h) => h.startsWith("qty") || h.includes("quantity")),
            uom: header.findIndex(
              (h) => h === "uom" || h === "unit" || h.includes("unit of measure")
            ),
            unitPrice: header.findIndex(
              (h) => h.includes("unit price") || h === "price" || h.includes("rate")
            ),
            total: header.findIndex(
              (h) =>
                h.includes("sub-total") ||
                h.includes("subtotal") ||
                h === "total" ||
                h.includes("amount")
            ),
          };
          const fallbackUnitAsPriceIndex =
            colIndex.unitPrice === -1 && colIndex.total === -1 ? colIndex.uom : -1;

          const sheetProducts = [];
          for (let i = headerIndex + 1; i < rows.length; i++) {
            const r = rows[i];
            if (!r || r.every((v) => !v)) continue;

            const desc = (r[colIndex.description] || "").toString().trim();
            if (!desc) continue;

            const skipWords = ["included", "note", "division", "page"];
            if (skipWords.some((w) => desc.toLowerCase().includes(w))) continue;

            const itemNoRaw = (r[colIndex.itemNo] || "").toString().trim();
            const normalizedItemNo = itemNoRaw.replace(/\s+/g, "").replace(/\.+$/g, "");
            const itemLevel = normalizedItemNo
              ? normalizedItemNo.split(".").filter(Boolean).length
              : 0;

            const qtyRaw = r[colIndex.qty]?.toString() || "";
            const qty = parseFloat(qtyRaw.replace(/[^\d.]/g, "")) || 0;

            const unitPriceRaw = r[colIndex.unitPrice]?.toString() || "";
            const unitPriceValue = parseFloat(unitPriceRaw.replace(/[^\d.]/g, "")) || 0;

            const totalRaw = r[colIndex.total]?.toString() || "";
            let totalValue = parseFloat(totalRaw.replace(/[^\d.]/g, "")) || 0;

            let rawUom = (r[colIndex.uom] || "").toString().trim();
            let normalizedUom = rawUom.toUpperCase();
            let unitType = UNIT_OPTIONS.find((u) => u.toUpperCase() === normalizedUom) || "";
            if (fallbackUnitAsPriceIndex !== -1) {
              const fallbackRaw = (r[fallbackUnitAsPriceIndex] || "").toString();
              const fallbackValue =
                parseFloat(fallbackRaw.replace(/[^\d.]/g, "")) || 0;
              if (fallbackValue > 0 && totalValue === 0 && unitPriceValue === 0) {
                totalValue = fallbackValue;
                rawUom = "";
                normalizedUom = "";
                unitType = "";
              }
            }
            const hasNumericValues = qty > 0 || unitPriceValue > 0 || totalValue > 0;

            if (!hasNumericValues) {
              if (itemLevel === 1) {
                sheetProducts.push(
                  buildRow({
                    titleAbove: desc,
                    isSubtitleOnly: true,
                  })
                );
                continue;
              }
              if (itemLevel >= 2) {
                sheetProducts.push(
                  buildRow({
                    subtitleAbove: desc,
                    isSubtitleOnly: true,
                  })
                );
                continue;
              }
              continue;
            }

            const unitPrice =
              unitPriceValue > 0
                ? unitPriceValue
                : totalValue > 0
                ? qty > 0
                  ? totalValue / qty
                  : totalValue
                : 0;

            sheetProducts.push(
              buildRow({
                productCode: r[colIndex.productCode]?.toString().trim() || "",
                description: desc,
                qty,
                unit: unitPrice || 0,
                unitType,
                discount: 0,
              })
            );
          }

          if (sheetProducts.length) {
            parsedSheets += 1;
            products.push(...sheetProducts);
          }
        }

        if (!products.length) {
          toast.error("No valid products found in Excel.");
          return;
        }

        const normalizedRows = products.map((row, index) => {
          const qty = Number(row.qty || 0);
          const unit = Number(row.unit || 0);
          const discount = Number(row.discount || 0);
          const unitPrice = qty * unit * (1 - discount / 100);
          return {
            ...row,
            id: index + 1,
            number: index + 1,
            unitPrice,
          };
        });

        setRows(normalizedRows);
        setShowTitles(
          normalizedRows.map((row) => !!String(row?.titleAbove || "").trim())
        );
        setShowSubtitles(
          normalizedRows.map((row) => !!String(row?.subtitleAbove || "").trim())
        );
        setSelectedRows([]);
        setSharedPriceValue("");
        setUploadedExcelName(file?.name || "Excel file");
        toast.success(
          `Loaded ${normalizedRows.length} products from ${parsedSheets} sheet(s)!`
        );
      } catch (err) {
        console.error("EXCEL PARSE ERROR", err);
        toast.error("Failed to parse Excel file. Please check format.");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const resetExcelImport = () => {
    if (quotation?.products) {
      const { newRows, initialShow, initialShowSubtitles } =
        buildRowsFromProducts(quotation.products || []);
      setRows(newRows);
      setShowTitles(initialShow);
      setShowSubtitles(initialShowSubtitles);
    } else {
      const emptyRow = buildRow({ id: 1, number: 1 });
      setRows([emptyRow]);
      setShowTitles([false]);
      setShowSubtitles([false]);
    }
    setSelectedRows([]);
    setSharedPriceValue("");
    setUploadedExcelName("");
    if (excelInputRef.current) excelInputRef.current.value = "";
  };




  const handleTitleChange = (index, value) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, titleAbove: value } : row))
    );
  };
  const handleSubtitleChange = (index, value) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, subtitleAbove: value } : row))
    );
  };

  // ---------- simple form ops ----------

  const handleCompanyChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      companyProfile: value,
    }));
  };

  const handleClientSelect = (clientId) => {
    const selected = clients.find((client) => client._id === clientId);
    setFormData((prev) => ({
      ...prev,
      clientId,
      clientName: selected?.name || "",
    }));
  };

  const handleSaleSelect = (saleId) => {
    const selected = sales.find((sale) => sale._id === saleId);
    setFormData((prev) => ({
      ...prev,
      saleId,
      saleName: selected?.name || "",
    }));
  };

  const handleInputChange = (fieldName, value) => {
    if (fieldName === "totalDiscount") {
      const cleaned =
        formData.totalDiscountType === "PERCENT"
          ? String(value).replace(/[^\d.%]/g, "")
          : String(value).replace(/[^\d.]/g, "");
      setFormData((prev) => ({
        ...prev,
        totalDiscount: cleaned,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [fieldName]: typeof value === "string" ? value.toUpperCase() : value,
    }));
  };

  const loadOnlyOfficeScript = () =>
    new Promise((resolve, reject) => {
      if (typeof window === "undefined") return;
      if (window.DocsAPI) return resolve();
      const existing = document.querySelector('script[data-oo="true"]');
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", reject);
        return;
      }
      const script = document.createElement("script");
      script.src = `${onlyOfficeUrl}/web-apps/apps/api/documents/api.js`;
      script.dataset.oo = "true";
      script.onload = () => resolve();
      script.onerror = (e) => reject(e);
      document.body.appendChild(script);
    });

  const openOnlyOfficeEditor = async () => {
    try {
      await loadOnlyOfficeScript();
      setIsOnlyOfficeOpen(true);
      setTimeout(initOnlyOfficeEditor, 50);
    } catch (err) {
      console.error("OnlyOffice script load failed:", err);
      alert("Failed to load OnlyOffice editor. Is the document server running?");
    }
  };

  const initOnlyOfficeEditor = async () => {
    if (typeof window === "undefined" || !window.DocsAPI) return;
    const target = document.getElementById("onlyoffice-container");
    if (!target) return;
    target.innerHTML = "";

    let payloadForDoc = null;
    try {
      payloadForDoc = buildDocumentData("docx");
    } catch (e) {
      console.error("Failed to build document data for OnlyOffice:", e);
    }

    const res = await fetch("/api/onlyoffice/template/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "SVS_Quotation_NEW.docx",
        onlyOfficeUrl,
        quotationId: params.id,
        payload: payloadForDoc,
      }),
    });
    if (!res.ok) {
      alert("Failed to load template config");
      return;
    }
    const config = await res.json();
    // eslint-disable-next-line no-new
    new window.DocsAPI.DocEditor("onlyoffice-container", config);
  };


  // ---------- submit/update ----------
  const buildRowsForSubmit = () => {
    const out = [];
    let last = undefined;

    rows.forEach((row, index) => {
      let emitTitle;
      let emitSubtitle;
      if (showTitles[index]) {
        const norm = (row.titleAbove || "").trim();
        if (norm && norm !== last) {
          emitTitle = norm; // start new section
          last = norm;
        } else {
          emitTitle = undefined; // same as last -> don't repeat
        }
      }
      if (showSubtitles[index]) {
        const norm = (row.subtitleAbove || "").trim();
        emitSubtitle = norm || undefined;
      }

      // NOTE: server may recompute totals;
      // we still send discount and raw inputs.
      const hasLineContent =
        !!String(row.productCode || "").trim() ||
        !!String(row.description || "").trim() ||
        Number(row.qty || 0) > 0 ||
        Number(row.unit || 0) > 0;
      if (row.isSubtitleOnly && !hasLineContent) {
        out.push({
          titleAbove: emitTitle,
          subtitleAbove: emitSubtitle,
          isSubtitleOnly: true,
        });
        return;
      }
      out.push({
        productCode: row.productCode,
        unitPrice: Number(row.unitPrice || 0), // discounted line total
        unit: Number(row.unit || 0),
        unitType: row.unitType || undefined,
        isSubtitleOnly: false,
        qty: Number(row.qty || 0),
        description: row.description,
        titleAbove: emitTitle,        // ONLY first row of section carries the title
        subtitleAbove: emitSubtitle,
        discount: Number(row.discount || 0), // NEW
        sharedGroupId: row.sharedGroupId || undefined,
        sharedGroupPrice:
          row.sharedGroupPrice !== null && row.sharedGroupPrice !== undefined
            ? Number(row.sharedGroupPrice)
            : undefined,
      });
    });

    return out;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.clientId) {
      alert("Please select a client before updating this quotation.");
      return;
    }
    if (!formData.saleId) {
      alert("Please select a sale representative before updating this quotation.");
      return;
    }
    const rowInputs = buildRowsForSubmit();
    await updateQuotation({
      id: params.id,
      ...formData,
      saleId: formData.saleId,
      products: rowInputs,
      currency: selectedCurrency, // NEW: keep currency on update as well
      totalDiscount: totals.totalDiscountPct, // normalized percentage
      // you can send breakdowns too if your action supports them:
      subtotal: totals.subtotal,
      subtotalAfterTotalDiscount: totals.subtotalAfterTotalDiscount,
      vatAmount: totals.vatAmount,
      totalPrice: totals.totalUnitPriceWithVAT, // grand total
    });
  };

  const uploadPdfToSynology = async () => {
    if (synologyUploading) return;
    setSynologyUploading(true);
    setSynologyStatus("Uploading...");
    try {
      await uploadQuotationDocument();
      setSynologyStatus("Uploaded to Synology");
    } catch (err) {
      console.error("Synology upload failed:", err);
      setSynologyStatus("Upload failed");
    } finally {
      setSynologyUploading(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!formData.clientId) {
      alert("Please select a client before editing this quotation.");
      return;
    }
    if (!formData.saleId) {
      alert("Please select a sale representative before editing this quotation.");
      return;
    }
    const rowInputs = buildRowsForSubmit();
    await editQuotation({
      id: params.id,
      ...formData,
      saleId: formData.saleId,
      products: rowInputs,
      currency: selectedCurrency,
      totalDiscount: totals.totalDiscountPct, // normalized percentage
      subtotal: totals.subtotal,                       // NEW
      subtotalAfterTotalDiscount: totals.subtotalAfterTotalDiscount, // NEW
      vatAmount: totals.vatAmount,                     // NEW
      totalPrice: Number(totals.totalUnitPriceWithVAT),// CHANGED: send grand total
    });
  };

  // ---------- preview / download ----------
  const previewQuotationDocument = async (asPopup = false) => {
  try {
    const payload = buildDocumentData("word-to-pdf");
    const res = await fetch(`/api/quotation/${params.id}/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`Preview failed (${res.status})`);
    const buf = await res.arrayBuffer();
    const blob = new Blob([buf], { type: "application/pdf" });
    const blobUrl = URL.createObjectURL(blob);

    if (asPopup) {
      if (pdfUrl && pdfUrl.startsWith("blob:")) URL.revokeObjectURL(pdfUrl);
      setPdfUrl(blobUrl);
      setIsPreviewOpen(true);
    } else {
      window.open(blobUrl, "_blank", "noopener,noreferrer");
    }
  } catch (e) {
    console.error("Preview fetch error:", e);
    alert(e.message || "Failed to load preview.");
  }
};

  const downloadWordDocument = async () => {
    try {
      const payload = buildDocumentData("docx");
      const res = await fetch(`/api/quotation/${params.id}/preview?format=docx`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const buf = await res.arrayBuffer();
      const blob = new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const fileQuotationNumber =
        quotation?.quotationId || formData.quotationId || params.id;
      a.download = `Quotation_${fileQuotationNumber}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error("Word download error:", e);
      alert(e.message || "Failed to download Word file.");
    }
  };

  // ---------- upload ----------
  const uploadQuotationDocument = async () => {
    try {
      const payload = buildDocumentData("word-to-pdf"); // logs happen inside
      const res = await fetch(`/api/loadQuoToSynology`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Server responded with status: ${res.status}, message: ${t}`);
      }
      alert("PDF uploaded successfully!");
    } catch (err) {
      console.error("Upload error:", err);
      alert((err && err.message) || "Upload failed.");
    }
  };

  // ---------- render ----------
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading quotation: {error}</div>;
  if (!quotation) return null;

  const sharedGroupSeen = new Set();

  return (
    <div className={styles.quotationPage}>
      <form onSubmit={handleSubmit} className={styles.quotationForm}>
        <div className={styles.container}>
          <div className={styles.quoteHeader}>
            <span className={styles.quoteIdLabel}>Quotation ID</span>
            <span className={styles.quoteIdValue}>{formData.quotationId}</span>
          </div>

          <div className={styles.quoteActionRow}>
            <button type="button" className={styles.DownloadButton} onClick={handleEdit}>
              Edit
            </button>

            <button
              type="button"
              className={`${styles.DownloadButton} ${
                rows.length > 0 && formData.userName && formData.userName.trim() !== "N/A"
                  ? ""
                  : styles.DisabledButton
              }`}
              onClick={downloadWordDocument}
              disabled={rows.length === 0 || !formData.userName || formData.userName.trim() === "N/A"}
            >
              Download Word
            </button>

            <button
              type="button"
              className={`${styles.DownloadButton} ${
                rows.length > 0 && formData.userName && formData.userName.trim() !== "N/A"
                  ? ""
                  : styles.DisabledButton
              }`}
              onClick={() => previewQuotationDocument(true)}
              disabled={rows.length === 0 || !formData.userName || formData.userName.trim() === "N/A"}
            >
              Preview PDF
            </button>

            <button
              type="button"
              className={`${styles.DownloadButton} ${
                rows.length > 0 && formData.userName && formData.userName.trim() !== "N/A"
                  ? ""
                  : styles.DisabledButton
              }`}
              onClick={uploadQuotationDocument}
              disabled={rows.length === 0 || !formData.userName || formData.userName.trim() === "N/A"}
            >
              Upload To Synology
            </button>
          </div>

          <div className={`${styles.form1} ${styles.quoteDetailsGrid}`}>
            <input type="hidden" name="id" value={params.id} />
            <div className={styles.inputContainer}>
              <label className={styles.label}>Admin Name:</label>
              <input
                type="text"
                className={styles.input}
                value={formData.userName}
                onChange={(e) => handleInputChange("userName", e.target.value)}
                readOnly
              />
            </div>
            <div className={styles.inputContainer}>
              <label className={styles.label}>Client Name:</label>
              <select
                className={styles.input}
                value={formData.clientId || ""}
                onChange={(e) => handleClientSelect(e.target.value)}
                disabled={clientsLoading}
              >
                <option value="">
                  {clientsLoading
                    ? "Loading clients..."
                    : clientsError || "Select Client"}
                </option>
                {clients.map((client) => (
                  <option key={client._id} value={client._id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.inputContainer}>
              <label className={styles.label}>Sale Representative Name:</label>
              <select
                className={styles.input}
                value={formData.saleId || ""}
                onChange={(e) => handleSaleSelect(e.target.value)}
                disabled={salesLoading}
              >
                <option value="">
                  {salesLoading
                    ? "Loading sales..."
                    : salesError || "Select Sale Representative"}
                </option>
                {sales.map((sale) => (
                  <option key={sale._id} value={sale._id}>
                    {sale.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.inputContainer}>
              <label className={styles.label}>Project Name:</label>
              <input
                className={styles.input}
                value={formData.projectName}
                onChange={(e) => handleInputChange("projectName", e.target.value)}
              />
            </div>
            <div className={styles.inputContainer}>
              <label className={styles.label}>Project Location Address:</label>
              <input
                className={styles.input}
                value={formData.projectLA}
                onChange={(e) => handleInputChange("projectLA", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className={styles.container}>
          <div className={styles.form2}>
            <p className={styles.title}>Products</p>

            <div className={styles.brandToggle}>
              <span className={styles.brandToggleLabel}>Select Company:</span>
              <div className={styles.brandToggleButtons}>
                {COMPANY_OPTIONS.map((option) => {
                  const isActive = (formData.companyProfile || "SMART_VISION") === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`${styles.brandToggleButton} ${
                        isActive ? styles.brandToggleButtonActive : ""
                      }`}
                      onClick={() => handleCompanyChange(option.value)}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.selectContainer}>
              <div className={styles.selectWrapper}>
                <label htmlFor="currency" className={styles.selectLabel}>
                  Select Currency:
                </label>
                <select
                  id="currency"
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className={styles.select}
                >
                  <option value="USD">USD</option>
                  <option value="SAR">SAR</option>
                </select>
              </div>
            </div>
            <div className={styles.onlyOfficeRow}>
              <button type="button" className={styles.DownloadButton} onClick={openOnlyOfficeEditor}>
                Edit template (OnlyOffice)
              </button>
            </div>

            <table className={styles.table}>
              <thead>
                <tr>
                  <td>Select</td>
                  <td>Number</td>
                  <td>Product Code</td>
                  <td>Description</td>
                  <td>Qty</td>
                  <td>UOM</td>
                  <td>Unit Price</td>
                  <td>Discount %</td> {/* NEW */}
                  <td>Total Price</td>
                  <td>Actions</td>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const sharedInfo = row.sharedGroupId
                    ? sharedGroupMeta[row.sharedGroupId]
                    : null;
                  const isSharedRow = !!(sharedInfo && sharedInfo.count > 1);
                  const sharedKey = getSharedGroupKey(row);
                  const isFirstSharedRow =
                    !!sharedKey && !sharedGroupSeen.has(sharedKey);
                  if (sharedKey) {
                    sharedGroupSeen.add(sharedKey);
                  }
                  return (
                  <React.Fragment key={row.id}>
                    {/* Title input row (togglable) */}
                    {showTitles[index] && (
                      <tr className={`${styles.row} ${styles.titleRow}`}>
                        <td colSpan={10} className={styles.titleRowCell}> {/* CHANGED colSpan */}
                          <input
                            type="text"
                            placeholder='Section title above this product (e.g., "Electrical Works")'
                            className={styles.titleInput}
                            value={row.titleAbove}
                            onChange={(e) => handleTitleChange(index, e.target.value)}
                          />
                        </td>
                      </tr>
                    )}
                    {showSubtitles[index] && (
                      <tr className={`${styles.row} ${styles.titleRow}`}>
                        <td colSpan={10} className={styles.titleRowCell}>
                          <input
                            type="text"
                            placeholder='Section subtitle above this product'
                            className={styles.titleInput}
                            value={row.subtitleAbove}
                            onChange={(e) => handleSubtitleChange(index, e.target.value)}
                          />
                        </td>
                      </tr>
                    )}

                    {/* Product row */}
                    <tr
                      className={`${styles.row} ${
                        draggingIndex === index ? styles.draggingRow : ""
                      } ${isSharedRow ? styles.sharedRow : ""}`}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => handleDropOnRow(event, index)}
                    >
                      <td>
                        <input
                          type="checkbox"
                          className={styles.selectionCheckbox}
                          checked={selectedRows.includes(index)}
                          onChange={() => toggleRowSelection(index)}
                        />
                      </td>
                      <td>
                        <input
                          className={`${styles.input} ${styles.numberInput}`}
                          type="text"
                          value={row.number.toString().padStart(3, "0")}
                          readOnly
                        />
                      </td>
                      <td>
                        <input
                          className={styles.input1}
                          placeholder="Product Code"
                          value={row.productCode}
                          onChange={(e) => handleRowInputChange(index, "productCode", e.target.value)}
                        />
                      </td>
                      <td>
  <button
    type="button"
    className={styles.descButton}
    onClick={() => {
      setActiveDescIndex(index);
      setRichDescValue(row.description || "");
      setIsDescPopupOpen(true);
    }}
  >
    <FaEdit style={{ marginRight: 6 }} />
    {row.description
      ? `${stripHtml(row.description).slice(0, 35)}${
          stripHtml(row.description).length > 35 ? "..." : ""
        }`
      : "Add Description"}
  </button>
</td>

                      <td>
                        <input
                          className={styles.input1}
                          placeholder="Qty"
                          value={row.qty}
                          onChange={(e) => handleRowInputChange(index, "qty", e.target.value)}
                        />
                      </td>
                      <td>
                        <select
                          className={styles.input1}
                          value={row.unitType || ""}
                          onChange={(e) => handleRowInputChange(index, "unitType", e.target.value)}
                        >
                          <option value="">-</option>
                          {UNIT_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          className={styles.input1}
                          placeholder="Unit Price"
                          value={row.unit}
                          onChange={(e) => handleRowInputChange(index, "unit", e.target.value)}
                        />
                        {isSharedRow && (
                          <div
                            className={styles.sharedTag}
                            style={{ borderColor: sharedInfo.color, color: sharedInfo.color }}
                          >
                            {sharedInfo.label} · {sharedInfo.count} products share
                            {" "}
                            {sharedInfo.price != null
                              ? `a total of ${formatCurrency(sharedInfo.price)}`
                              : "this set price"}
                          </div>
                        )}
                      </td>
                      <td> {/* NEW: per-line discount */}
                        <input
                          className={styles.input1}
                          placeholder="Discount %"
                          value={row.discount}
                          onChange={(e) => handleRowInputChange(index, "discount", e.target.value)}
                        />
                      </td>
                      <td>
                        {sharedKey && !isFirstSharedRow
                          ? "-"
                          : formatCurrency(getRowLineTotal(row))}
                      </td>
                      <td className={styles.actionsCell}>
                        {/* Section title toggle */}
                        <button
                          type="button"
                          className={`${styles.titleToggleButton} ${
                            showTitles[index] ? styles.titleToggleButtonActive : ""
                          }`}
                          onClick={() => toggleTitleForRow(index)}
                          title={showTitles[index] ? "Hide title" : "Add title above row"}
                        >
                          <FaTag size={12} />
                          {showTitles[index] ? "Title" : "Title"}
                        </button>
                        <button
                          type="button"
                          className={`${styles.subtitleToggleButton} ${
                            showSubtitles[index] ? styles.subtitleToggleButtonActive : ""
                          }`}
                          onClick={() => toggleSubtitleForRow(index)}
                          title={
                            showSubtitles[index]
                              ? "Hide subtitle"
                              : "Add subtitle above row"
                          }
                        >
                          SUB
                        </button>

                        {/* Drag handle */}
                        <button
                          type="button"
                          className={`${styles.iconButton} ${styles.dragButton}`}
                          draggable
                          onDragStart={(event) => handleDragStartRow(event, index)}
                          onDragEnd={handleDragEndRow}
                          title="Drag to reorder"
                        >
                          <FaGripLines />
                        </button>

                        {/* Delete is now always available */}
                        <button
                          type="button"
                          className={`${styles.iconButton} ${styles.deleteButton}`}
                          onClick={() => deleteRow(index)}
                          title="Delete this product"
                        >
                          <FaTrash />
                        </button>
                        {row.sharedGroupId && (
                          <button
                            type="button"
                            className={`${styles.iconButton} ${styles.unlinkButton}`}
                            title="Remove shared price from this product"
                            onClick={() => removeSharedPriceFromRow(index)}
                          >
                            <FaUnlink />
                          </button>
                        )}

                        {/* Only the last row shows the add button */}
                        {index === rows.length - 1 && (
                          <>
                            <button
                              type="button"
                              className={`${styles.iconButton} ${styles.addButton}`}
                              onClick={addRow}
                              title="Add new product"
                            >
                              <FaPlus />
                            </button>
                            <button
                              type="button"
                              className={styles.addSubtitleButton}
                              onClick={addSubtitleRow}
                              title="Add subtitle row"
                            >
                              +SUB
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  </React.Fragment>
                )})}
              </tbody>
            </table>

            <div className={styles.sharedPriceControls}>
              <div className={styles.sharedPriceInfo}>
                {selectedRows.length > 0
                  ? `${selectedRows.length} product${
                      selectedRows.length > 1 ? "s" : ""
                    } selected`
                  : "Select two or more products to share a price"}
              </div>
              <input
                type="number"
                min="0"
                placeholder="Shared price per product"
                value={sharedPriceValue}
                onChange={(e) => setSharedPriceValue(e.target.value)}
                className={styles.sharedPriceInput}
              />
              <button
                type="button"
                className={styles.sharedPriceButton}
                onClick={applySharedPriceToSelection}
                disabled={selectedRows.length < 2 || !sharedPriceValue}
              >
                Apply Shared Price
              </button>
              <button
                type="button"
                className={styles.sharedPriceButtonSecondary}
                onClick={clearRowSelection}
              >
                Clear Selection
              </button>
            </div>

            <div className={styles.inputContainer}>
              <label className={styles.label}>Upload Excel File:</label>
              <input
                ref={excelInputRef}
                type="file"
                accept=".xlsx, .xls"
                onChange={(e) => handleExcelUpload(e.target.files && e.target.files[0])}
                className={styles.input}
              />
              {uploadedExcelName && (
                <button
                  type="button"
                  onClick={resetExcelImport}
                  className={styles.excelRemoveButton}
                >
                  ✖ Remove Excel ({uploadedExcelName})
                </button>
              )}
            </div>

            {Object.keys(sharedGroupMeta).length > 0 && (
              <div className={styles.sharedLegend}>
                {Object.entries(sharedGroupMeta).map(([id, info]) => (
                  <div
                    key={id}
                    className={styles.sharedLegendItem}
                    style={{ borderColor: info.color, color: info.color }}
                  >
                    <span
                      className={styles.sharedLegendDot}
                      style={{ background: info.color }}
                    />
                    <strong>{info.label}</strong>
                    <span>· {info.count} products</span>
                    {info.price != null && (
                      <span>· Shared total {formatCurrency(info.price)}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Total discount can be percent or fixed amount */}
            <div className={`${styles.inputContainer} ${styles.totalDiscountInput}`}>
              <label className={styles.label}>Total Discount (optional):</label>
              <div className={styles.discountInputRow}>
                <input
                  className={styles.input}
                  placeholder={formData.totalDiscountType === "PERCENT" ? "0 or 10%" : "0.00"}
                  value={formData.totalDiscount}
                  onChange={(e) => handleInputChange("totalDiscount", e.target.value)}
                />
                <select
                  className={styles.select}
                  value={formData.totalDiscountType || "PERCENT"}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      totalDiscountType: e.target.value,
                      totalDiscount: "",
                    }))
                  }
                >
                  <option value="PERCENT">%</option>
                  <option value="AMOUNT">Amount</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.container}>
          <div className={`${styles.form5} ${styles.totalsCard}`}>
            {/* CHANGED: use new totals */}
            <p>Subtotal (after line discounts): {formatCurrency(totals.subtotal)}</p>
            <p>Discount: {formatCurrency(totals.discountAmount)} ({formatCurrency(totals.totalDiscountPct)}%)</p>
            <p>Subtotal after Total Discount: {formatCurrency(totals.subtotalAfterTotalDiscount)}</p>
            <p>VAT ({selectedCurrency === "USD" ? "0%" : "15%"}): {formatCurrency(totals.vatAmount)}</p>
            <p>Total (Incl. VAT): {formatCurrency(totals.totalUnitPriceWithVAT)}</p>
          </div>
        </div>

        <div className={styles.container}>
          <div className={styles.form1}>
            <div className={styles.inputContainer}>
              <label className={styles.label}>Payment Term:</label>
              <textarea
                className={styles.input}
                value={formData.paymentTerm}
                onChange={(e) => handleInputChange("paymentTerm", e.target.value)}
              />
            </div>
            <div className={styles.inputContainer}>
              <label className={styles.label}>Payment Delivery:</label>
              <textarea
                className={styles.input}
                value={formData.paymentDelivery}
                onChange={(e) => handleInputChange("paymentDelivery", e.target.value)}
              />
            </div>
            <div className={styles.inputContainer}>
              <label className={styles.label}>Validity Period:</label>
              <textarea
                className={styles.input}
                value={formData.validityPeriod}
                onChange={(e) => handleInputChange("validityPeriod", e.target.value)}
              />
            </div>
            <div className={styles.inputContainer}>
              <label className={styles.label}>Note:</label>
              <textarea
                className={styles.input}
                value={formData.note}
                onChange={(e) => handleInputChange("note", e.target.value)}
              />
            </div>
            <div className={styles.inputContainer}>
              <label className={styles.label}>Excluding:</label>
              <textarea
                className={styles.input}
                value={formData.excluding}
                onChange={(e) => handleInputChange("excluding", e.target.value)}
              />
            </div>
            <div className={styles.inputContainer}>
              <label className={styles.label}>Warranty:</label>
              <textarea
                className={styles.input}
                value={formData.warranty}
                onChange={(e) => handleInputChange("warranty", e.target.value)}
              />
            </div>

            <div className={styles.submitRow}>
              <button type="submit" className={styles.submitInlineButton}>
                Update
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* ---------- Popup modal ---------- */}
      {isPreviewOpen && (
        <div
          onClick={() => {
            setIsPreviewOpen(false);
            if (pdfUrl && pdfUrl.startsWith && pdfUrl.startsWith("blob:")) {
              URL.revokeObjectURL(pdfUrl);
            }
            setPdfUrl(null);
          }}
          className={styles.previewOverlay}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={styles.previewCard}
          >
            <div className={styles.previewToolbar}>
              <button
                className={styles.DownloadButton}
                onClick={() => {
                  if (!pdfUrl) return;
                  const a = document.createElement("a");
                  a.href = pdfUrl;
                  const qNum = formData.quotationId || quotation?.quotationId || params.id || "Preview";
                  a.download = `${qNum}.pdf`;

                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}
              >
                Download this PDF
              </button>

              <button
                className={styles.DownloadButton}
                onClick={() => {
                  setIsPreviewOpen(false);
                  if (pdfUrl) {
                    window.open(pdfUrl, "_blank");
                  }
                }}
              >
                Open in new tab
              </button>

              <button
                onClick={() => {
                  setIsPreviewOpen(false);
                  if (pdfUrl && pdfUrl.startsWith && pdfUrl.startsWith("blob:")) {
                    URL.revokeObjectURL(pdfUrl);
                  }
                  setPdfUrl(null);
                }}
                className={styles.previewClose}
              >
                ✖
              </button>
            </div>

            <div className={styles.previewContent}>
              {pdfUrl ? (
                <iframe title="Quotation Preview" src={pdfUrl} width="100%" height="100%" style={{ border: "none" }} />
              ) : (
                <div style={{ padding: 24 }}>Loading PDF…</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------- Description Popup ---------- */}
{isDescPopupOpen && (
  <div
    onClick={() => setIsDescPopupOpen(false)}
    className={styles.descOverlay}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className={styles.descCard}
    >
      <h2 className={styles.descTitle}>Edit Product Description</h2>

  

     <ReactQuill
  theme="snow"
  value={richDescValue}
  onChange={setRichDescValue}
  className="quillDark"
  modules={{
    toolbar: [
      [{ header: [1, 2, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "clean"],
    ],
  }}
/>

      <div className={styles.descActions}>
        <button
          onClick={() => setIsDescPopupOpen(false)}
          className={styles.descCancel}
        >
          Cancel
        </button>
        <button
          onClick={() => {
            if (activeDescIndex !== null)
              handleRowInputChange(activeDescIndex, "description", richDescValue);
            setIsDescPopupOpen(false);
          }}
          className={styles.descSave}
        >
          Save
        </button>
      </div>
    </div>
  </div>
)}

      {/* ---------- OnlyOffice Template Editor Modal ---------- */}
      {isOnlyOfficeOpen && (
        <div className={styles.previewBackdrop} onClick={() => setIsOnlyOfficeOpen(false)}>
          <div
            className={styles.previewModal}
            style={{ width: "95vw", maxWidth: "1200px", height: "90vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.previewHeader}>
              <span>Edit Template (OnlyOffice)</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  className={styles.DownloadButton}
                  type="button"
                  onClick={uploadPdfToSynology}
                  disabled={synologyUploading}
                >
                  {synologyUploading ? "Uploading..." : "Upload PDF to Synology"}
                </button>
                <button onClick={() => setIsOnlyOfficeOpen(false)}>✖</button>
              </div>
            </div>
            <div style={{ flex: 1, background: "#0f172a" }}>
              <div id="onlyoffice-container" style={{ width: "100%", height: "100%" }} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SingleQuotation;
