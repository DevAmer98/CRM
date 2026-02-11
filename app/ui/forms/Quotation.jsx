// quotation/form.jsx
'use client'
import styles from '@/app/ui/dashboard/approve/approve.module.css'
import { addQuotation } from '@/app/lib/actions'
import { FaPlus, FaTrash, FaTag, FaEdit, FaUnlink } from 'react-icons/fa'
import React, { useEffect, useState, useRef } from 'react'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })
import 'react-quill/dist/quill.snow.css'
import * as XLSX from "xlsx";

const buildRow = (overrides = {}) => ({
  productCode: '',
  qty: 0,
  unit: 0,
  unitType: '',
  discount: 0,
  description: '',
  titleAbove: '',
  subtitleAbove: '',
  isSubtitleOnly: false,
  sharedGroupId: null,
  sharedGroupPrice: null,
  ...overrides,
});

const handleExcelUpload = (file, setRows, toast) => {
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

        // 🔍 Find header row per sheet
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

        const header = rows[headerIndex].map((h) => h.toString().toLowerCase().trim());
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

      setRows(products);
      toast.success(`Loaded ${products.length} products from ${parsedSheets} sheet(s)!`);
    } catch (err) {
      console.error("EXCEL PARSE ERROR", err);
      toast.error("Failed to parse Excel file. Please check format.");
    }
  };

  reader.readAsArrayBuffer(file);
};


const COMPANY_OPTIONS = [
  { value: 'SMART_VISION', label: 'Smart Vision' },
  { value: 'ARABIC_LINE', label: 'ArabicLine' },
];
const UNIT_OPTIONS = ['m', 'm2', 'm3', 'PCS', 'LM', 'L/S', 'Roll', 'EA', 'Trip'];

/* ---------------- Schema ---------------- */
const productSchema = z.object({
  productCode: z.string().optional(),
  unitPrice: z.number().optional(),
  unit: z.number().optional(),
  unitType: z.string().optional(),
  isSubtitleOnly: z.boolean().optional(),
  qty: z.number().optional(),
  description: z.string().optional(),
  titleAbove: z.string().optional(),
  subtitleAbove: z.string().optional(),
  discount: z.number().min(0).max(100).optional(),
  sharedGroupId: z.string().nullable().optional(),
  sharedGroupPrice: z.number().nullable().optional(),
})

const quotationSchema = z.object({
  saleId: z.string().min(1, 'Sale Representative is required'),
  requestedById: z.string().optional(),
  clientId: z.string().min(1, 'Client is required'),
  projectName: z.string().optional(),
  projectLA: z.string().optional(),
  products: z.array(productSchema),
  paymentTerm: z.string().optional(),
  paymentDelivery: z.string().optional(),
  validityPeriod: z.string().optional(),
  note: z.string().optional(),
  warranty: z.string().optional(),
  excluding: z.string().optional(),
  currency: z.enum(['USD', 'SAR'], { message: 'Currency is required' }),
  totalDiscount: z.number().min(0).max(100).optional(),
  totalPrice: z.number().min(0, 'Total price must be 0 or higher'),
  companyProfile: z.enum(['SMART_VISION', 'ARABIC_LINE']).default('SMART_VISION'),
})

/* ---------------- Component ---------------- */
const AddQuotation = () => {
  const router = useRouter()
  const domain = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

  const [clients, setClients] = useState([])
  const [sales, setSales] = useState([])
  const [rows, setRows] = useState([buildRow()])
  const [selectedCurrency, setSelectedCurrency] = useState('USD')
  const [showTitles, setShowTitles] = useState([false])
  const [showSubtitles, setShowSubtitles] = useState([false])
  const [isDescPopupOpen, setIsDescPopupOpen] = useState(false)
  const [activeDescIndex, setActiveDescIndex] = useState(null)
  const [richDescValue, setRichDescValue] = useState('')
  const [totalDiscount, setTotalDiscount] = useState(0)
  const [showNote, setShowNote] = useState(false);
  const [showWarranty, setShowWarranty] = useState(false);
  const [showExcluding, setShowExcluding] = useState(false);
  const [companyProfile, setCompanyProfile] = useState('SMART_VISION');
  const [selectedRows, setSelectedRows] = useState([])
  const [sharedPriceValue, setSharedPriceValue] = useState('')
  const [saleSearch, setSaleSearch] = useState('')
  const [selectedSaleId, setSelectedSaleId] = useState('')
  const [requestedBySearch, setRequestedBySearch] = useState('')
  const [selectedRequestedById, setSelectedRequestedById] = useState('')
  const [clientSearch, setClientSearch] = useState('')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [uploadedExcelName, setUploadedExcelName] = useState('')
  const excelInputRef = useRef(null)


  const stripHtml = (html) => html.replace(/<[^>]*>?/gm, '').trim()
  const clampPct = (n) => Math.min(Math.max(Number(n) || 0, 0), 100)
  const getClientLabel = (client) => String(client?.name || '')
  const getSaleLabel = (sale) => String(sale?.name || '')

  const getRowLineTotal = (row) => {
    if (
      row.sharedGroupId &&
      row.sharedGroupPrice !== null &&
      row.sharedGroupPrice !== undefined
    ) {
      const discountPct = clampPct(row.discount)
      const base = Number(row.sharedGroupPrice) || 0
      return base * (1 - discountPct / 100)
    }
    const qty = Number(row.qty) || 0
    const unit = Number(row.unit) || 0
    const discountPct = clampPct(row.discount)
    const base = qty * unit
    return base * (1 - discountPct / 100)
  }

  /* ---------- Fetch data ---------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, salesRes] = await Promise.all([
          fetch(`${domain}/api/allClients`),
          fetch(`${domain}/api/allSales`),
        ])
        const clientsData = await clientsRes.json()
        const salesData = await salesRes.json()
        setClients(clientsData)
        setSales(salesData)
      } catch {
        toast.error('Failed to load clients or sales')
      }
    }
    fetchData()
  }, [domain])

  /* ---------- Handlers ---------- */
  const handleRowInputChange = (index, field, value) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)))
  }

  const resetExcelImport = () => {
    setRows([buildRow()])
    setShowTitles([false])
    setShowSubtitles([false])
    setSelectedRows([])
    setSharedPriceValue('')
    setUploadedExcelName('')
    if (excelInputRef.current) excelInputRef.current.value = ''
  }

  const filteredClients = clients.filter((client) => {
    const query = clientSearch.trim().toLowerCase()
    if (!query) return true
    const name = String(client?.name || '').toLowerCase()
    const email = String(client?.email || '').toLowerCase()
    const phone = String(client?.phone || '').toLowerCase()
    return name.includes(query) || email.includes(query) || phone.includes(query)
  })

  const filteredSales = sales.filter((sale) => {
    const query = saleSearch.trim().toLowerCase()
    if (!query) return true
    const name = String(sale?.name || '').toLowerCase()
    const email = String(sale?.email || '').toLowerCase()
    return name.includes(query) || email.includes(query)
  })
  const filteredRequestedBySales = sales.filter((sale) => {
    const query = requestedBySearch.trim().toLowerCase()
    if (!query) return true
    const name = String(sale?.name || '').toLowerCase()
    const email = String(sale?.email || '').toLowerCase()
    return name.includes(query) || email.includes(query)
  })

  const handleClientSearchChange = (value) => {
    setClientSearch(value)
    const matched = clients.find((client) => getClientLabel(client) === value)
    setSelectedClientId(matched?._id || '')
  }

  const handleSaleSearchChange = (value) => {
    setSaleSearch(value)
    const matched = sales.find((sale) => getSaleLabel(sale) === value)
    setSelectedSaleId(matched?._id || '')
  }

  const handleRequestedBySearchChange = (value) => {
    setRequestedBySearch(value)
    const matched = sales.find((sale) => getSaleLabel(sale) === value)
    setSelectedRequestedById(matched?._id || '')
  }

  const toggleRowSelection = (index) => {
    setSelectedRows((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    )
  }

  const clearRowSelection = () => setSelectedRows([])

  const removeSharedPriceFromRow = (index) => {
    setRows((prev) =>
      prev.map((row, i) =>
        i === index ? { ...row, sharedGroupId: null, sharedGroupPrice: null } : row
      )
    )
  }

  const applySharedPriceToSelection = () => {
    const uniqueIndexes = Array.from(new Set(selectedRows))
    if (uniqueIndexes.length < 2) {
      toast.error('Select at least two products to apply a shared price')
      return
    }
    const numericPrice = Number(sharedPriceValue)
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      toast.error('Enter a valid shared price greater than 0')
      return
    }
    const normalizedPrice = Number(numericPrice.toFixed(2))
    const groupId = `grp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const indexSet = new Set(uniqueIndexes)
    setRows((prev) =>
      prev.map((row, idx) =>
        indexSet.has(idx)
          ? { ...row, sharedGroupId: groupId, sharedGroupPrice: normalizedPrice }
          : row
      )
    )
    setSharedPriceValue('')
    setSelectedRows([])
    toast.success(`Shared price applied to ${uniqueIndexes.length} products`)
  }



  const decodeAndCleanHtml = (html) => {
  if (!html) return ''
  // Create a temporary element to decode HTML entities
  const temp = document.createElement('div')
  temp.innerHTML = html
  return temp.innerHTML // keeps bold/italic tags but decodes entities
}


/**
 * Safely parse an Excel file into quotation product rows
 * @param {File} file - The uploaded Excel file
 * @param {Function} setRows - State setter for rows
 * @param {Function} toast - Toast handler for messages
 */

const cleanQuillHtml = (html) => {
  if (!html) return ''
  return html
    .replace(/&nbsp;/g, ' ')       // convert &nbsp; to normal space
    .replace(/\s+/g, ' ')          // collapse multiple spaces
    .replace(/<p><br><\/p>/g, '')  // remove empty paragraphs
    .replace(/<p>/g, '<p>')        // keep paragraph structure
    .trim()
}


  const addRow = () => {
    setRows((prev) => [...prev, buildRow()])
    setShowTitles((prev) => [...prev, false])
    setShowSubtitles((prev) => [...prev, false])
    setSelectedRows([])
  }
  const addSubtitleRow = () => {
    setRows((prev) => [...prev, buildRow({ isSubtitleOnly: true })])
    setShowTitles((prev) => [...prev, false])
    setShowSubtitles((prev) => [...prev, true])
    setSelectedRows([])
  }

  const deleteRow = (index) => {
    const updated = rows.filter((_, i) => i !== index)
    setRows(updated)
    setShowTitles((prev) => prev.filter((_, i) => i !== index))
    setShowSubtitles((prev) => prev.filter((_, i) => i !== index))
    setSelectedRows([])
  }

  const toggleTitleForRow = (index) => {
    setShowTitles((prev) => prev.map((v, i) => (i === index ? !v : v)))
  }
  const toggleSubtitleForRow = (index) => {
    setShowSubtitles((prev) => prev.map((v, i) => (i === index ? !v : v)))
  }

  /* ---------- Calculations ---------- */
  const calculateTotalUnitPrice = () => {
    const subtotalAfterLineDiscounts = rows.reduce(
      (sum, row) => sum + getRowLineTotal(row),
      0
    )

    const subtotalAfterTotalDiscount = subtotalAfterLineDiscounts * (1 - totalDiscount / 100)
    const vatRate = selectedCurrency === 'USD' ? 0 : 0.15
    const vatAmount = subtotalAfterTotalDiscount * vatRate
    const totalUnitPriceWithVAT = subtotalAfterTotalDiscount + vatAmount

    return {
      subtotal: Number(subtotalAfterLineDiscounts.toFixed(2)),
      vatAmount: Number(vatAmount.toFixed(2)),
      totalUnitPriceWithVAT: Number(totalUnitPriceWithVAT.toFixed(2)),
    }
  }

  /* ---------- Submit ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault()
    const form = e.target

    const totals = calculateTotalUnitPrice()
    const totalWithVat = totals.totalUnitPriceWithVAT

    const products = []
    let currentSectionTitle
    rows.forEach((row, i) => {
      if (showTitles[i]) {
        const cleaned = String(row.titleAbove || '').trim()
        currentSectionTitle = cleaned || undefined
      }
      const subtitleCleaned = String(row.subtitleAbove || '').trim()
      const lineTotal = getRowLineTotal(row)
      const hasLineContent =
        !!String(row.productCode || '').trim() ||
        !!String(row.description || '').trim() ||
        Number(row.qty || 0) > 0 ||
        Number(row.unit || 0) > 0

      if (row.isSubtitleOnly && !hasLineContent) {
        products.push({
          number: i + 1,
          titleAbove: currentSectionTitle,
          subtitleAbove: showSubtitles[i] ? (subtitleCleaned || undefined) : undefined,
          isSubtitleOnly: true,
        })
        return
      }
      products.push({
        number: i + 1,
        productCode: row.productCode,
        unit: Number(row.unit || 0),
        unitType: row.unitType || undefined,
        isSubtitleOnly: false,
        qty: Number(row.qty || 0),
        unitPrice: Number(lineTotal.toFixed(2)),
        description: row.description || '',
        titleAbove: currentSectionTitle,
        subtitleAbove: showSubtitles[i] ? (subtitleCleaned || undefined) : undefined,
        discount: row.discount || undefined,
        sharedGroupId: row.sharedGroupId || undefined,
        sharedGroupPrice:
          row.sharedGroupPrice !== null && row.sharedGroupPrice !== undefined
            ? Number(row.sharedGroupPrice)
            : undefined,
      })
    })

    const payload = {
      saleId: form.saleId.value,
      requestedById: form.requestedById.value,
      clientId: form.clientId.value,
      projectName: form.projectName.value,
      projectLA: form.projectLA.value,
      products,
      paymentTerm: form.paymentTerm.value,
      paymentDelivery: form.paymentDelivery.value,
      validityPeriod: form.validityPeriod.value,
      note: form.note ? form.note.value : '',
      warranty: form.warranty ? form.warranty.value : '',
      excluding: form.excluding ? form.excluding.value : '',
      currency: selectedCurrency,
      totalDiscount,
      totalPrice: totalWithVat,
      companyProfile,
    }

    try {
      const validated = quotationSchema.parse(payload)
      const result = await addQuotation(validated)
      if (result.success) {
        toast.success('Quotation added successfully!')
        router.push('/dashboard/quotations')
      } else {
        toast.error(result.error || 'Failed to add quotation')
      }
    } catch (err) {
      if (err instanceof z.ZodError) err.errors.forEach((e) => toast.error(e.message))
      else toast.error(err?.message || 'Something went wrong')
    }
  }

  /* ---------- UI ---------- */
  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit}>
        {/* --- Client & Sale --- */}
        <div className={styles.form1}>
          <div className={styles.inputContainer}>
            <label className={styles.label}>Sale Representative:</label>
            <input
              type="text"
              className={styles.input}
              placeholder="Search sales representative..."
              value={saleSearch}
              onChange={(e) => handleSaleSearchChange(e.target.value)}
              list="sales-options"
            />
            <datalist id="sales-options">
              {filteredSales.map((sale) => (
                <option key={sale._id} value={getSaleLabel(sale)} />
              ))}
            </datalist>
            <input type="hidden" name="saleId" value={selectedSaleId} />
          </div>
          <div className={styles.inputContainer}>
            <label className={styles.label}>Requested by:</label>
            <input
              type="text"
              className={styles.input}
              placeholder="Search requester..."
              value={requestedBySearch}
              onChange={(e) => handleRequestedBySearchChange(e.target.value)}
              list="requested-by-options"
            />
            <datalist id="requested-by-options">
              {filteredRequestedBySales.map((sale) => (
                <option key={sale._id} value={getSaleLabel(sale)} />
              ))}
            </datalist>
            <input type="hidden" name="requestedById" value={selectedRequestedById} />
          </div>
          <div className={styles.inputContainer}>
            <label className={styles.label}>Client:</label>
            <input
              type="text"
              className={styles.input}
              placeholder="Search client..."
              value={clientSearch}
              onChange={(e) => handleClientSearchChange(e.target.value)}
              list="client-options"
            />
            <datalist id="client-options">
              {filteredClients.map((client) => (
                <option key={client._id} value={getClientLabel(client)} />
              ))}
            </datalist>
            <input type="hidden" name="clientId" value={selectedClientId} />
          </div>
          <div className={styles.inputContainer}>
            <label className={styles.label}>Project Name:</label>
            <input name="projectName" className={styles.input} />
          </div>
          <div className={styles.inputContainer}>
            <label className={styles.label}>Project Address:</label>
            <input name="projectLA" className={styles.input} />
          </div>
        </div>

        {/* --- Products --- */}
        <div className={styles.form2}>
          <p className={styles.title}>Products</p>
          <div className={styles.brandToggle}>
            <span className={styles.brandToggleLabel}>Select Company:</span>
            <div className={styles.brandToggleButtons}>
              {COMPANY_OPTIONS.map((option) => {
                const isActive = companyProfile === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`${styles.brandToggleButton} ${isActive ? styles.brandToggleButtonActive : ''}`}
                    onClick={() => setCompanyProfile(option.value)}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className={styles.selectWrapper}>
            <label className={styles.selectLabel}>Select Currency:</label>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className={styles.select}
            >
              <option value="USD">USD</option>
              <option value="SAR">SAR</option>
            </select>
          </div>

          <table className={styles.table}>
            <thead>
              <tr>
                <td>Select</td>
                <td>#</td>
                <td>Code</td>
                <td>Description</td>
                <td>Qty</td>
                <td>UOM</td>
                <td>Unit Price</td>
                <td>Discount %</td>
                <td>Total</td>
                <td>Actions</td>
              </tr>
            </thead>
            <tbody>
            {rows.map((r, i) => (
  <React.Fragment key={i}>
    {showTitles[i] && (
      <tr><td colSpan={10}><input name={`titleAbove${i}`} className={styles.titleInput} placeholder="Section title" value={r.titleAbove || ''} onChange={(e) => handleRowInputChange(i, 'titleAbove', e.target.value)} /></td></tr>
    )}
    {showSubtitles[i] && (
      <tr><td colSpan={10}><input name={`subtitleAbove${i}`} className={styles.titleInput} placeholder="Section subtitle" value={r.subtitleAbove || ''} onChange={(e) => handleRowInputChange(i, 'subtitleAbove', e.target.value)} /></td></tr>
    )}
    <tr>
      <td>
        <input
          type="checkbox"
          className={styles.selectionCheckbox}
          checked={selectedRows.includes(i)}
          onChange={() => toggleRowSelection(i)}
        />
      </td>
      <td>{String(i + 1).padStart(3, '0')}</td>
      <td><input className={styles.input1} value={r.productCode} onChange={(e) => handleRowInputChange(i, 'productCode', e.target.value)} /></td>
      <td>
      <button
  type="button"
  className={styles.descButton}
  onClick={() => {
    setActiveDescIndex(i)
    setRichDescValue(r.description || '')
    setIsDescPopupOpen(true)
  }}
>
  <FaEdit style={{ marginRight: 6 }} />
  {r.description ? (
    <span
      style={{
        display: 'inline-block',
        maxWidth: '200px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        verticalAlign: 'middle',
      }}
      dangerouslySetInnerHTML={{
        __html: decodeAndCleanHtml(r.description),
      }}
    />
  ) : (
    'Add Description'
  )}
</button>


      </td>
      <td><input type="number" className={styles.input1} value={r.qty} onChange={(e) => handleRowInputChange(i, 'qty', e.target.value)} /></td>
      <td>
        <select
          className={styles.input1}
          value={r.unitType || ''}
          onChange={(e) => handleRowInputChange(i, 'unitType', e.target.value)}
        >
          <option value="">-</option>
          {UNIT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </td>
      <td><input type="number" className={styles.input1} value={r.unit} onChange={(e) => handleRowInputChange(i, 'unit', e.target.value)} /></td>
      <td><input type="number" className={styles.input1} value={r.discount} onChange={(e) => handleRowInputChange(i, 'discount', e.target.value)} /></td>
      <td>
        {getRowLineTotal(r).toFixed(2)}
        {r.sharedGroupId && (
          <span className={styles.sharedPriceBadge}>Shared</span>
        )}
      </td>
      <td className={styles.actionsCell}>
  {/* Toggle Title Above Row */}
  <button
    type="button"
    title="Add Section Title Above"
    className={`${styles.titleToggleButton} ${showTitles[i] ? styles.titleToggleButtonActive : ''}`}
    onClick={() => toggleTitleForRow(i)}
  >
    <FaTag />
  </button>
  <button
    type="button"
    title="Add Section Subtitle Above"
    className={`${styles.subtitleToggleButton} ${showSubtitles[i] ? styles.subtitleToggleButtonActive : ''}`}
    onClick={() => toggleSubtitleForRow(i)}
  >
    SUB
  </button>

  {/* Add or Delete Row */}
  {i === rows.length - 1 ? (
    <button
      type="button"
      className={`${styles.iconButton} ${styles.addButton}`}
      onClick={addRow}
      title="Add New Product"
    >
      <FaPlus />
    </button>
  ) : (
    <button
      type="button"
      className={`${styles.iconButton} ${styles.deleteButton}`}
      onClick={() => deleteRow(i)}
      title="Remove Product"
    >
      <FaTrash />
    </button>
  )}
  {i === rows.length - 1 && (
    <button
      type="button"
      className={styles.addSubtitleButton}
      onClick={addSubtitleRow}
      title="Add Subtitle Row"
    >
      +SUB
    </button>
  )}
  {r.sharedGroupId && (
    <button
      type="button"
      className={`${styles.iconButton} ${styles.unlinkButton}`}
      title="Remove shared price from this product"
      onClick={() => removeSharedPriceFromRow(i)}
    >
      <FaUnlink />
    </button>
  )}
</td>

    </tr>
  </React.Fragment>
))}

            </tbody>
          </table>

          <div className={styles.sharedPriceControls}>
            <div className={styles.sharedPriceInfo}>
              {selectedRows.length > 0
                ? `${selectedRows.length} product${selectedRows.length > 1 ? 's' : ''} selected`
                : 'Select two or more products to share a price'}
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
            <label className={styles.label}>Total Discount %</label>
            <input
              type="number"
              value={totalDiscount}
              onChange={(e) => setTotalDiscount(Number(e.target.value))}
              className={styles.input}
            />
          </div>
        </div>

      {/* --- Footer --- */}
{/* --- Footer Section --- */}
<div className={styles.footerSection}>
  <div className={styles.inputContainer}>
    <label className={styles.label}>Payment Terms:</label>
    <textarea
      name="paymentTerm"
      placeholder="Enter Payment Terms"
      className={styles.input}
    ></textarea>
  </div>

  <div className={styles.inputContainer}>
    <label className={styles.label}>Delivery Terms:</label>
    <textarea
      name="paymentDelivery"
      placeholder="Enter Delivery Terms"
      className={styles.input}
    ></textarea>
  </div>

  <div className={styles.inputContainer}>
    <label className={styles.label}>Validity Period:</label>
    <textarea
      name="validityPeriod"
      placeholder="Enter Validity Period"
      className={styles.input}
    ></textarea>
  </div>

  {/* --- Optional Sections --- */}
  <div className={styles.optionalToggles}>
    <label className={styles.toggleLabel}>
      <input
        type="checkbox"
        checked={showNote}
        onChange={() => setShowNote(!showNote)}
      />
      <span>Add Note</span>
    </label>

    <label className={styles.toggleLabel}>
      <input
        type="checkbox"
        checked={showWarranty}
        onChange={() => setShowWarranty(!showWarranty)}
      />
      <span>Add Warranty</span>
    </label>

    <label className={styles.toggleLabel}>
      <input
        type="checkbox"
        checked={showExcluding}
        onChange={() => setShowExcluding(!showExcluding)}
      />
      <span>Add Excluding</span>
    </label>
  </div>

  {showNote && (
    <div className={styles.inputContainer}>
      <label className={styles.label}>Note:</label>
      <textarea name="note" placeholder="Enter Note" className={styles.input}></textarea>
    </div>
  )}

  {showWarranty && (
    <div className={styles.inputContainer}>
      <label className={styles.label}>Warranty:</label>
      <textarea
        name="warranty"
        placeholder="Enter Warranty Details"
        className={styles.input}
      ></textarea>
    </div>
  )}

  {showExcluding && (
    <div className={styles.inputContainer}>
      <label className={styles.label}>Excluding:</label>
      <textarea
        name="excluding"
        placeholder="Enter Excluding Details"
        className={styles.input}
      ></textarea>
    </div>
  )}


  <div className={styles.inputContainer}>
  <label className={styles.label}>Upload Excel File:</label>
  <input
    ref={excelInputRef}
    type="file"
    accept=".xlsx, .xls"
    onChange={(e) => {
      const file = e.target.files[0]
      handleExcelUpload(
        file,
        (importedRows) => {
          if (!Array.isArray(importedRows)) return
          setRows(importedRows)
          setShowTitles(importedRows.map((row) => !!String(row?.titleAbove || '').trim()))
          setShowSubtitles(importedRows.map((row) => !!String(row?.subtitleAbove || '').trim()))
          setSelectedRows([])
          setUploadedExcelName(file?.name || 'Excel file')
        },
        toast
      )
    }}
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


  <button type="submit" className={styles.submitButton}>
    Submit
  </button>
</div>

      </form>

      {/* --- Description Popup --- */}
      {isDescPopupOpen && (
        <div
          onClick={() => setIsDescPopupOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#0f172a', padding: 24, borderRadius: 8, width: '80%', maxWidth: 800 }}
          >
            <h2 style={{ color: '#fff' }}>Edit Description</h2>
            <ReactQuill theme="snow" value={richDescValue} onChange={setRichDescValue} />
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <button onClick={() => setIsDescPopupOpen(false)} style={{ marginRight: 8 }}>Cancel</button>
            <button
  onClick={() => {
    if (activeDescIndex !== null) {
      const cleaned = cleanQuillHtml(richDescValue)
      handleRowInputChange(activeDescIndex, 'description', cleaned)
    }
    setIsDescPopupOpen(false)
  }}

                style={{ background: '#2563eb', color: '#fff', padding: '6px 12px', borderRadius: 4 }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AddQuotation
