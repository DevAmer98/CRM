// app/ui/forms/AddQuotation.jsx
'use client'
import styles from '@/app/ui/dashboard/approve/approve.module.css';
import { addQuotation } from '@/app/lib/actions'
import { FaPlus, FaTrash, FaTag, FaEdit } from 'react-icons/fa';
import React, { useEffect, useState } from 'react'
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import ReactQuill from 'react-quill';
import "react-quill/dist/quill.snow.css";


// NEW: allow per-line discount
const productSchema = z.object({
  productCode: z.string().optional(),
  unitPrice: z.number().optional(),
  unit: z.number().optional(),
  qty: z.number().optional(),
  description: z.string().optional(),
  titleAbove: z.string().optional(), // section title applied to this product
  discount: z.number().min(0).max(100).optional(), // NEW: per-line %
});

// NEW: allow totalDiscount on subtotal
const quotationSchema = z.object({
  saleId: z.string().min(1, "Sale Representative is required"),
  clientId: z.string().min(1, "Client is required"),
  projectName: z.string().optional(),
  projectLA: z.string().optional(),
  products: z.array(productSchema),
  paymentTerm: z.string().optional(),
  paymentDelivery: z.string().optional(),
  validityPeriod: z.string().optional(),
  note: z.string().optional(),
  excluding: z.string().optional(),
  currency: z.enum(["USD", "SAR"], { message: "Currency is required" }),
  totalDiscount: z.number().min(0).max(100).optional(), // NEW: subtotal %
  totalPrice: z.number().min(0, "Total price must be 0 or higher"),
});

const AddQuotation = () => {
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [sales, setSales] = useState([]);
  const [rows, setRows] = useState([{ number: 1 }]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const domain = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [isDescPopupOpen, setIsDescPopupOpen] = useState(false);
  const [activeDescIndex, setActiveDescIndex] = useState(null);
  const [richDescValue, setRichDescValue] = useState("");

  // show title input above row
  const [showTitles, setShowTitles] = useState([false]);
    const stripHtml = (html) => html.replace(/<[^>]*>?/gm, "").trim();


    // Add this function
const handleRowInputChange = (index, field, value) => {
  setRows((prev) =>
    prev.map((row, i) =>
      i === index ? { ...row, [field]: value } : row
    )
  );
};



  const fetchClients = async () => {
    try {
      const response = await fetch(`${domain}/api/allClients`, { cache: 'no-store', method: 'GET' });
      const data = await response.json();
      setClients(data);
      setLoading(false);
    } catch (err) { setLoading(false); setError('Failed to load clients'); }
  };
  useEffect(() => { fetchClients(); }, []);

  const fetchSales = async () => {
    try {
      const response = await fetch(`${domain}/api/allSales`, { method: 'GET' });
      const data = await response.json();
      setSales(data);
      setLoading(false);
    } catch (err) { setLoading(false); setError('Failed to load sales'); }
  };
  useEffect(() => { fetchSales(); }, []);

  const addRow = () => {
    setRows(prev => [...prev, { number: prev.length + 1 }]);
    setShowTitles(prev => [...prev, false]);
  };

  const deleteRow = (index) => {
    const updatedRows = rows.filter((_, i) => i !== index)
      .map((row, i) => ({ ...row, number: i + 1 }));
    setRows(updatedRows);
    setShowTitles(prev => prev.filter((_, i) => i !== index));
  };

  const toggleTitleForRow = (index) => {
    setShowTitles(prev => prev.map((v, i) => (i === index ? !v : v)));
  };

  const clampPct = (n) => Math.min(Math.max((Number(n) || 0), 0), 100); // NEW

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.target;

    const totals = calculateTotalUnitPrice(); // CHANGED: now includes discounts
    const totalWithVat = Number(totals.totalUnitPriceWithVAT.toFixed(2)); // CHANGED

    // Build products with forward-inheritance of title
    const products = [];
    let currentSectionTitle = undefined;

    rows.forEach((_, index) => {
      if (showTitles[index]) {
        const raw = form[`titleAbove${index}`]?.value ?? '';
        const cleaned = raw.trim();
        currentSectionTitle = cleaned || undefined;
      }

      const qtyVal = Number(form[`qty${index}`].value);
      const unitVal = Number(form[`unit${index}`].value);
      const discountPct = clampPct(form[`discount${index}`]?.value); // NEW

      const base = (!isNaN(qtyVal) && !isNaN(unitVal)) ? qtyVal * unitVal : 0;
      const lineTotal = base * (1 - discountPct / 100); // NEW

      products.push({
        number: index + 1,
        productCode: form[`productCode${index}`].value,
        unit: unitVal,
        qty: qtyVal,
        unitPrice: Number(lineTotal.toFixed(2)), // CHANGED: store discounted line total
        description: rows[index]?.description || "",
        titleAbove: currentSectionTitle, // inherited
        discount: discountPct || undefined, // NEW
      });
    });

    // NEW: total discount on subtotal (optional)
    const totalDiscount = clampPct(form.totalDiscount?.value);

    const payload = {
      saleId: form.saleId.value,
      clientId: form.clientId.value,
      projectName: form.projectName.value,
      projectLA: form.projectLA.value,
      products,
      paymentTerm: form.paymentTerm.value,
      paymentDelivery: form.paymentDelivery.value,
      validityPeriod: form.validityPeriod.value,
      note: form.note.value,
      excluding: form.excluding.value,
      currency: selectedCurrency,
      totalDiscount,                // NEW
      totalPrice: totalWithVat,     // after total discount + VAT
    };

    try {
      const validated = quotationSchema.parse(payload);
      const result = await addQuotation(validated);
      if (result.success) {
        toast.success('Quotation added successfully!');
        router.push('/dashboard/quotations');
      } else {
        toast.error(result.error || 'Failed to add quotation');
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        err.errors.forEach((e) => toast.error(e.message));
      } else {
        toast.error(err?.message || 'Something went wrong');
      }
    }
  };

  useEffect(() => { setIsClient(typeof window !== 'undefined'); }, []);

  // CHANGED: include per-line and total discounts in calculation
  const calculateTotalUnitPrice = () => {
  if (typeof document === "undefined") return { subtotal: 0, vatAmount: 0, totalUnitPriceWithVAT: 0, totalDiscountPct: 0 };

  let subtotalAfterLineDiscounts = 0;
  rows.forEach((_, index) => {
    const qty = Number(document.querySelector(`[name="qty${index}"]`)?.value || 0);
    const unit = Number(document.querySelector(`[name="unit${index}"]`)?.value || 0);
    const discountPct = clampPct(document.querySelector(`[name="discount${index}"]`)?.value || 0);

    const base = qty * unit;
    const discounted = base * (1 - discountPct / 100);
    subtotalAfterLineDiscounts += discounted;
  });

  const totalDiscPct = clampPct(document.querySelector(`[name="totalDiscount"]`)?.value || 0);
  const subtotalAfterTotalDiscount = subtotalAfterLineDiscounts * (1 - totalDiscPct / 100);

  const vatRate = selectedCurrency === 'USD' ? 0 : 0.15;
  const vatAmount = subtotalAfterTotalDiscount * vatRate;
  const totalUnitPriceWithVAT = subtotalAfterTotalDiscount + vatAmount;

  return {
    subtotal: Number(subtotalAfterLineDiscounts.toFixed(2)),
    vatAmount: Number(vatAmount.toFixed(2)),
    totalUnitPriceWithVAT: Number(totalUnitPriceWithVAT.toFixed(2)),
    totalDiscountPct: totalDiscPct,
  };
};

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit}>
        <div className={styles.container}>
          <div className={styles.form1}>
            <div className={styles.inputContainer}>
              <label className={styles.label}>Sale Representative Name:</label>
              <select name='saleId' className={styles.input} defaultValue="">
                <option value="" disabled>Select Sale Representative</option>
                {sales.map((sale) => (
                  <option key={sale._id} value={sale._id}>{sale.name}</option>
                ))}
              </select>
            </div>
            <div className={styles.inputContainer}>
              <label className={styles.label}>Client Name:</label>
              <select name='clientId' className={styles.input} defaultValue="">
                <option value="" disabled>Select Client</option>
                {clients.map((client) => (
                  <option key={client._id} value={client._id}>{client.name}</option>
                ))}
              </select>
            </div>
            <div className={styles.inputContainer}>
              <label className={styles.label}>Project Name:</label>
              <input type='text' name='projectName' className={styles.input} placeholder='Project Name' />
            </div>
            <div className={styles.inputContainer}>
              <label className={styles.label}>Project Location Address:</label>
              <input type='text' name='projectLA' className={styles.input} placeholder='Project Location Address' />
            </div>
          </div>
        </div>

        <div className={styles.container}>
          <div className={styles.form2}>
            <p className={styles.title}>Products</p>

            <div className={styles.selectContainer}>
              <div className={styles.selectWrapper}>
                <label htmlFor="currency" className={styles.selectLabel}>Select Currency:</label>
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
                  <td>Unit Price</td>
                  <td>Discount %</td> {/* NEW */}
                  <td>Total Price</td>
                  <td>Actions</td>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <React.Fragment key={index}>
                    {showTitles[index] && (
                      <tr className={`${styles.row} ${styles.titleRow}`}>
                        <td colSpan={8} className={styles.titleRowCell}> {/* CHANGED colSpan to 8 */}
                          <input
                            type="text"
                            name={`titleAbove${index}`}
                            placeholder='Section title above this product (e.g., "Electrical Works")'
                            className={styles.titleInput}
                          />
                        </td>
                      </tr>
                    )}

                    <tr className={styles.row}>
                      <td>
                        <input
                          className={`${styles.input} ${styles.numberInput}`}
                          type="text"
                          value={row.number.toString().padStart(3, '0')}
                          readOnly
                        />
                      </td>
                      <td>
                        <input type='text' name={`productCode${index}`} className={styles.input1} />
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
                        <input type='number' name={`qty${index}`} className={styles.input1} step="any" />
                      </td>
                      <td>
                        <input type='number' name={`unit${index}`} className={styles.input1} step="any" />
                      </td>
                      <td> {/* NEW: Discount per line */}
                        <input
                          type='number'
                          name={`discount${index}`}
                          className={styles.input1}
                          step="any"
                          min={0}
                          max={100}
                          placeholder='0'
                          title='Discount percentage (0–100)'
                        />
                      </td>
                      <td></td>
                      <td className={styles.actionsCell}>
                        <button
                          type="button"
                          className={`${styles.titleButton} ${showTitles[index] ? styles.titleButtonActive : ''}`}
                          onClick={() => toggleTitleForRow(index)}
                          title={showTitles[index] ? 'Hide title' : 'Add title above row'}
                        >
                          <FaTag size={12} /> Title
                        </button>
                        {index === rows.length - 1 ? (
                          <button type="button" className={`${styles.iconButton} ${styles.addButton}`} onClick={addRow}>
                            <FaPlus />
                          </button>
                        ) : (
                          <button type="button" className={`${styles.iconButton} ${styles.deleteButton}`} onClick={() => deleteRow(index)}>
                            <FaTrash />
                          </button>
                        )}
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            {/* NEW: Total discount on subtotal */}
            <div className={styles.inputContainer} style={{ marginTop: 12 }}>
              <label className={styles.label}>Total Discount % (optional):</label>
              <input
                type="number"
                name="totalDiscount"
                className={styles.input}
                step="any"
                min={0}
                max={100}
                placeholder="0"
                title="Discount percentage on the subtotal (0–100)"
              />
            </div>
          </div>
        </div>

        <div className={styles.container}>
          <div className={styles.form1}>
            <div className={styles.inputContainer}>
              <label className={styles.label}>Payment Term:</label>
              <textarea name='paymentTerm' className={styles.input} placeholder='Payment Term' />
            </div>
            <div className={styles.inputContainer}>
              <label className={styles.label}>Payment Delivery:</label>
              <textarea name='paymentDelivery' className={styles.input} placeholder='Payment Delivery' />
            </div>
            <div className={styles.inputContainer}>
              <label className={styles.label}>Note:</label>
              <textarea name='note' className={styles.input} placeholder='Note' />
            </div>
            <div className={styles.inputContainer}>
              <label className={styles.label}>Validity Period:</label>
              <textarea name='validityPeriod' className={styles.input} placeholder='Validity Period' />
            </div>
            <div className={styles.inputContainer}>
              <label className={styles.label}>Excluding:</label>
              <textarea name='excluding' className={styles.input} placeholder='Excluding' />
            </div>

            <button type="submit">Submit</button>
          </div>
        </div>
      </form>
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
  )
}

export default AddQuotation
