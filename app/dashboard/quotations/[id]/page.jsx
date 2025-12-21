//app/dashboard/quotations/%5Bid%5D/page.jsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FaPlus, FaTrash, FaTag, FaEdit, FaGripLines } from "react-icons/fa";
import styles from "@/app/ui/dashboard/approve/approve.module.css";
import { editQuotation, updateQuotation } from "@/app/lib/actions";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  UNIT_MERGE_CONT_TOKEN,
  UNIT_MERGE_START_TOKEN,
} from "@/app/lib/sharedPriceTokens";
import { decodeHtmlEntities } from "@/app/lib/richTextUtils";

const COMPANY_OPTIONS = [
  { value: "SMART_VISION", label: "Smart Vision" },
  { value: "ARABIC_LINE", label: "ArabicLine" },
];

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
    companyProfile: "SMART_VISION",
  });

  // table rows + title toggles
  const [rows, setRows] = useState([]);
  const [showTitles, setShowTitles] = useState([]);
  const [draggingIndex, setDraggingIndex] = useState(null);

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

  // ---------- helpers ----------
  const clampPct = (n) => Math.min(Math.max(Number(n || 0), 0), 100); // NEW

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


  // CHANGED: totals now include line discount and total discount
  const totals = useMemo(() => {
    // subtotal after per-line discounts
    const subtotal = rows.reduce((acc, r) => acc + getRowLineTotal(r), 0);

    const totalDiscPct = clampPct(formData.totalDiscount); // NEW
    const subtotalAfterTotalDiscount = subtotal * (1 - totalDiscPct / 100); // NEW

    const vatRate = selectedCurrency === "USD" ? 0 : 0.15;
    const vatAmount = subtotalAfterTotalDiscount * vatRate; // NEW
    const total = subtotalAfterTotalDiscount + vatAmount;   // NEW

    return {
      subtotal: Number(subtotal.toFixed(2)),                                // NEW
      subtotalAfterTotalDiscount: Number(subtotalAfterTotalDiscount.toFixed(2)), // NEW
      vatAmount: Number(vatAmount.toFixed(2)),
      totalUnitPriceWithVAT: Number(total.toFixed(2)),
      totalDiscountPct: totalDiscPct, // for display/debug if needed
    };
  }, [rows, selectedCurrency, formData.totalDiscount]);

  // ---------- Build data for document preview/upload (SECTIONS) ----------
  const buildDocumentData = (mode = "word-to-pdf") => {
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
        currentSection = { Title: title, Items: [], __counter: 0 };
        Sections.push(currentSection);
      }

      // per-section numbering 001, 002, ...
      currentSection.__counter += 1;
      globalRowCounter += 1;

      // line totals with discount
      const qty = Number(r.qty || 0);
      const unit = Number(r.unit || 0);
      const rowSubtotal = getRowLineTotal(r);

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
          : UNIT_MERGE_CONT_TOKEN
        : formatCurrency(unit);
      const subtotalDisplay = hasSharedPrice
        ? isFirstSharedRow
          ? `${formatCurrency(rowSubtotal)}${UNIT_MERGE_START_TOKEN}`
          : UNIT_MERGE_CONT_TOKEN
        : formatCurrency(rowSubtotal);

      currentSection.Items.push({
        Number: String(globalRowCounter).padStart(3, "0"),
        ProductCode: (r.productCode || "—").toUpperCase(),
        DescriptionRich: wrapDesc(r.description),


        Qty: qty,
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


const payload = {
  renderMode: mode,
  templateId,

  QuotationNumber: (formData.quotationId || "").toUpperCase(),
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
  SaleName: (activeSaleForDoc.name || "").toUpperCase(),
  ClientContactName: (clientForDoc.contactName || "").toUpperCase(),
  userName: (quotation.user?.username || "").toUpperCase(),
  ClientPhone: (clientForDoc.phone || "").toUpperCase(),
  UserPhone: (activeSaleForDoc.phone || "").toUpperCase(),
  UserEmail: (activeSaleForDoc.email || ""),
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
        const res = await fetch(`/api/quotation/${params.id}`, { method: "GET" });
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
      companyProfile: quotation.companyProfile || "SMART_VISION",
    });

    setSelectedCurrency(quotation.currency || "USD");

    const newRows = [];
    const initialShow = [];
    let prev = undefined;

    (quotation.products || []).forEach((product, index) => {
      const norm = (product.titleAbove || "").trim();
      const isBoundary = !!norm && norm !== prev;

      newRows.push({
        _id: product._id,
        id: index + 1,
        number: index + 1,
        productCode: product.productCode || "",
        unitPrice: Number(product.unitPrice || 0), // row subtotal (we still recompute below)
        unit: product.unit || "", // unit price
        qty: product.qty || "",
        description: product.description || "",
        titleAbove: isBoundary ? norm : "", // only keep value where a section starts
        discount: Number(product.discount || 0), // NEW
        sharedGroupId: product.sharedGroupId || null,
        sharedGroupPrice:
          product.sharedGroupPrice !== undefined &&
          product.sharedGroupPrice !== null
            ? Number(product.sharedGroupPrice)
            : null,
      });

      initialShow.push(isBoundary);
      if (isBoundary) prev = norm;
    });

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
      titleAbove: "",
      sharedGroupId: null,
      sharedGroupPrice: null,
    };
    setRows((prev) => [...prev, newRow]);
    setShowTitles((prev) => [...prev, false]);
  };

  const deleteRow = (index) => {
    const updated = rows.filter((_, i) => i !== index);
    const renumbered = updated.map((r, i) => ({ ...r, id: i + 1, number: i + 1 }));
    setRows(renumbered);
    setShowTitles((prev) => prev.filter((_, i) => i !== index));
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


  const handleRowInputChange = (index, fieldName, value) => {
  const numericFields = ["qty", "unit", "discount"];
  const clean = numericFields.includes(fieldName)
    ? String(value).replace(/[^\d.]/g, "")
    : typeof value === "string"
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

      const base = (Number.isFinite(qty) ? qty : 0) * (Number.isFinite(unit) ? unit : 0);
      next.unitPrice = base * (1 - disc / 100);
      next.discount = disc;

      return next;
    })
  );
};




  const handleTitleChange = (index, value) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, titleAbove: value } : row))
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
  setFormData((prev) => ({
    ...prev,
    [fieldName]: typeof value === "string" ? value.toUpperCase() : value,
  }));
};


  // ---------- submit/update ----------
  const buildRowsForSubmit = () => {
    const out = [];
    let last = undefined;

    rows.forEach((row, index) => {
      let emitTitle;
      if (showTitles[index]) {
        const norm = (row.titleAbove || "").trim();
        if (norm && norm !== last) {
          emitTitle = norm; // start new section
          last = norm;
        } else {
          emitTitle = undefined; // same as last -> don't repeat
        }
      }

      // NOTE: server may recompute totals;
      // we still send discount and raw inputs.
      out.push({
        productCode: row.productCode,
        unitPrice: Number(row.unitPrice || 0), // discounted line total
        unit: Number(row.unit || 0),
        qty: Number(row.qty || 0),
        description: row.description,
        titleAbove: emitTitle,        // ONLY first row of section carries the title
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
      totalDiscount: clampPct(formData.totalDiscount), // NEW
      // you can send breakdowns too if your action supports them:
      subtotal: totals.subtotal,
      subtotalAfterTotalDiscount: totals.subtotalAfterTotalDiscount,
      vatAmount: totals.vatAmount,
      totalPrice: totals.totalUnitPriceWithVAT, // grand total
    });
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
      totalDiscount: clampPct(formData.totalDiscount), // NEW
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

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className={styles.container}>
          <div>Quotation ID: {formData.quotationId}</div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
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
              onClick={() => previewQuotationDocument(true)}
              disabled={rows.length === 0 || !formData.userName || formData.userName.trim() === "N/A"}
            >
              Preview
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

          <div className={styles.form1} style={{ marginTop: 12 }}>
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

            <table className={styles.table}>
              <thead>
                <tr>
                  <td>Number</td>
                  <td>Product Code</td>
                  <td>Description</td>
                  <td>Qty</td>
                  <td>Unit</td>
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
                  return (
                  <React.Fragment key={row.id}>
                    {/* Title input row (togglable) */}
                    {showTitles[index] && (
                      <tr className={`${styles.row} ${styles.titleRow}`}>
                        <td colSpan={8} className={styles.titleRowCell}> {/* CHANGED colSpan */}
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
                      <td>{formatCurrency(Number(row.unitPrice) || 0)}</td>
                      <td className={styles.actionsCell}>
                        {/* Section title toggle */}
                        <button
                          type="button"
                          className={`${styles.titleButton} ${
                            showTitles[index] ? styles.titleButtonActive : ""
                          }`}
                          onClick={() => toggleTitleForRow(index)}
                          title={showTitles[index] ? "Hide title" : "Add title above row"}
                        >
                          <FaTag size={12} />
                          {showTitles[index] ? "Title" : "Title"}
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

                        {/* Only the last row shows the add button */}
                        {index === rows.length - 1 && (
                          <button
                            type="button"
                            className={`${styles.iconButton} ${styles.addButton}`}
                            onClick={addRow}
                            title="Add new product"
                          >
                            <FaPlus />
                          </button>
                        )}
                      </td>
                    </tr>
                  </React.Fragment>
                )})}
              </tbody>
            </table>

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

            {/* NEW: Total Discount % on subtotal */}
            <div className={styles.inputContainer} style={{ marginTop: 12 }}>
              <label className={styles.label}>Total Discount % (optional):</label>
              <input
                className={styles.input}
                placeholder="0"
                value={formData.totalDiscount}
                onChange={(e) => handleInputChange("totalDiscount", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className={styles.container}>
          <div className={styles.form5}>
            {/* CHANGED: use new totals */}
            <p>Subtotal (after line discounts): {formatCurrency(totals.subtotal)}</p>
            <p>
              Subtotal after Total Discount ({formatCurrency(formData.totalDiscount)}%):{" "}
              {formatCurrency(totals.subtotalAfterTotalDiscount)}
            </p>
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

            <button type="submit">Update</button>
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
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              width: "80%",
              height: "80%",
              borderRadius: 8,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ padding: "8px 12px", borderBottom: "1px solid #eee", display: "flex", gap: 8 }}>
              <button
                className={styles.DownloadButton}
                onClick={() => {
                  if (!pdfUrl) return;
                  const a = document.createElement("a");
                  a.href = pdfUrl;
                 // a.download = `Quotation_${formData.quotationId || "Preview"}.pdf`;
                  const qNum = formData.quotationId || quotation?.quotationId || "Preview";
a.download = `Quotation_${qNum}.pdf`;

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
                style={{ marginLeft: "auto" }}
              >
                ✖
              </button>
            </div>

            <div style={{ flex: 1 }}>
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
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2000,
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: "#0f172a",
        color: "#e5e7eb",
        width: "80%",
        maxWidth: "1000px",
        borderRadius: "10px",
        padding: "24px",
        boxShadow: "0 0 40px rgba(0,0,0,0.5)",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <h2 style={{ color: "#fff", margin: 0 }}>Edit Product Description</h2>

  

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

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button
          onClick={() => setIsDescPopupOpen(false)}
          style={{
            padding: "8px 14px",
            background: "#334155",
            color: "#e5e7eb",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => {
            if (activeDescIndex !== null)
              handleRowInputChange(activeDescIndex, "description", richDescValue);
            setIsDescPopupOpen(false);
          }}
          style={{
            padding: "8px 14px",
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Save
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default SingleQuotation;
