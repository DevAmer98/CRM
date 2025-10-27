'use client'
import styles from '@/app/ui/dashboard/approve/approve.module.css'
import { addQuotation } from '@/app/lib/actions'
import { FaPlus, FaTrash, FaTag, FaEdit } from 'react-icons/fa'
import React, { useEffect, useState } from 'react'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })
import 'react-quill/dist/quill.snow.css'


/* ---------------- Schema ---------------- */
const productSchema = z.object({
  productCode: z.string().optional(),
  unitPrice: z.number().optional(),
  unit: z.number().optional(),
  qty: z.number().optional(),
  description: z.string().optional(),
  titleAbove: z.string().optional(),
  discount: z.number().min(0).max(100).optional(),
})

const quotationSchema = z.object({
  saleId: z.string().min(1, 'Sale Representative is required'),
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
})

/* ---------------- Component ---------------- */
const AddQuotation = () => {
  const router = useRouter()
  const domain = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

  const [clients, setClients] = useState([])
  const [sales, setSales] = useState([])
  const [rows, setRows] = useState([
    { number: 1, productCode: '', qty: 0, unit: 0, discount: 0, description: '' },
  ])
  const [selectedCurrency, setSelectedCurrency] = useState('USD')
  const [showTitles, setShowTitles] = useState([false])
  const [isDescPopupOpen, setIsDescPopupOpen] = useState(false)
  const [activeDescIndex, setActiveDescIndex] = useState(null)
  const [richDescValue, setRichDescValue] = useState('')
  const [totalDiscount, setTotalDiscount] = useState(0)
  const [showNote, setShowNote] = useState(false);
  const [showWarranty, setShowWarranty] = useState(false);
  const [showExcluding, setShowExcluding] = useState(false);


  const stripHtml = (html) => html.replace(/<[^>]*>?/gm, '').trim()
  const clampPct = (n) => Math.min(Math.max(Number(n) || 0, 0), 100)

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

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { number: prev.length + 1, productCode: '', qty: 0, unit: 0, discount: 0, description: '' },
    ])
    setShowTitles((prev) => [...prev, false])
  }

  const deleteRow = (index) => {
    const updated = rows
      .filter((_, i) => i !== index)
      .map((r, i) => ({ ...r, number: i + 1 }))
    setRows(updated)
    setShowTitles((prev) => prev.filter((_, i) => i !== index))
  }

  const toggleTitleForRow = (index) => {
    setShowTitles((prev) => prev.map((v, i) => (i === index ? !v : v)))
  }

  /* ---------- Calculations ---------- */
  const calculateTotalUnitPrice = () => {
    let subtotalAfterLineDiscounts = 0
    rows.forEach((r) => {
      const qty = Number(r.qty) || 0
      const unit = Number(r.unit) || 0
      const discountPct = clampPct(r.discount)
      const base = qty * unit
      subtotalAfterLineDiscounts += base * (1 - discountPct / 100)
    })

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
        const raw = form[`titleAbove${i}`]?.value ?? ''
        const cleaned = raw.trim()
        currentSectionTitle = cleaned || undefined
      }
      const lineTotal = (row.qty || 0) * (row.unit || 0) * (1 - (row.discount || 0) / 100)
      products.push({
        number: i + 1,
        productCode: row.productCode,
        unit: Number(row.unit || 0),
        qty: Number(row.qty || 0),
        unitPrice: Number(lineTotal.toFixed(2)),
        description: row.description || '',
        titleAbove: currentSectionTitle,
        discount: row.discount || undefined,
      })
    })

    const payload = {
      saleId: form.saleId.value,
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
            <select name="saleId" className={styles.input} defaultValue="">
              <option value="" disabled>Select Sale Representative</option>
              {sales.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
          <div className={styles.inputContainer}>
            <label className={styles.label}>Client:</label>
            <select name="clientId" className={styles.input} defaultValue="">
              <option value="" disabled>Select Client</option>
              {clients.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
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
                <td>#</td><td>Code</td><td>Description</td><td>Qty</td>
                <td>Unit</td><td>Discount %</td><td>Total</td><td>Actions</td>
              </tr>
            </thead>
            <tbody>
            {rows.map((r, i) => (
  <React.Fragment key={i}>
    {showTitles[i] && (
      <tr><td colSpan={8}><input name={`titleAbove${i}`} className={styles.titleInput} placeholder="Section title" /></td></tr>
    )}
    <tr>
      <td>{r.number.toString().padStart(3, '0')}</td>
      <td><input className={styles.input1} value={r.productCode} onChange={(e) => handleRowInputChange(i, 'productCode', e.target.value)} /></td>
      <td>
        <button type="button" className={styles.descButton}
          onClick={() => { setActiveDescIndex(i); setRichDescValue(r.description || ''); setIsDescPopupOpen(true) }}>
          <FaEdit style={{ marginRight: 6 }} />
          {r.description ? stripHtml(r.description).slice(0, 35) + (stripHtml(r.description).length > 35 ? '...' : '') : 'Add Description'}
        </button>
      </td>
      <td><input type="number" className={styles.input1} value={r.qty} onChange={(e) => handleRowInputChange(i, 'qty', e.target.value)} /></td>
      <td><input type="number" className={styles.input1} value={r.unit} onChange={(e) => handleRowInputChange(i, 'unit', e.target.value)} /></td>
      <td><input type="number" className={styles.input1} value={r.discount} onChange={(e) => handleRowInputChange(i, 'discount', e.target.value)} /></td>
      <td>{(r.qty * r.unit * (1 - r.discount / 100)).toFixed(2)}</td>
      <td className={styles.actionsCell}>
  {/* Toggle Title Above Row */}
  <button
    type="button"
    title="Add Section Title Above"
    className={`${styles.iconButton} ${showTitles[i] ? styles.titleActive : ''}`}
    onClick={() => toggleTitleForRow(i)}
  >
    <FaTag />
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
</td>

    </tr>
  </React.Fragment>
))}

            </tbody>
          </table>

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
                  if (activeDescIndex !== null) handleRowInputChange(activeDescIndex, 'description', richDescValue)
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
