//app/dashboard/approves/[id]/page.jsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FaPlus, FaTrash, FaTag, FaEdit } from "react-icons/fa";
import styles from "@/app/ui/dashboard/approve/approve.module.css";
import { updateQuotationApprove } from "@/app/lib/actions";
import { buildQuotationPayload } from "@/app/lib/buildQuotationPayload";
import { ROLES } from "@/app/lib/role";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const ADMIN = new Set(
  Object.values(ROLES).filter((role) => role.toLowerCase().includes("admin"))
);

const SingleApprovePage = ({ params }) => {
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [quotation, setQuotation] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setLoading] = useState(true);
  const [updateTrigger, setUpdateTrigger] = useState(false);

  const domain = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  // --- description popup ---
  const [isDescPopupOpen, setIsDescPopupOpen] = useState(false);
  const [activeDescIndex, setActiveDescIndex] = useState(null);
  const [richDescValue, setRichDescValue] = useState("");

  // --- form data ---
  const [formData, setFormData] = useState({
    user: "",
    saleName: "",
    clientName: "",
    projectName: "",
    projectLA: "",
    paymentTerm: "",
    paymentDelivery: "",
    validityPeriod: "",
    note: "",
    excluding: "",
    totalDiscount: 0,
  });

  const [rows, setRows] = useState([]);
  const [showTitles, setShowTitles] = useState([]);

  // ---------- helpers ----------
  const clampPct = (n) => Math.min(Math.max(Number(n || 0), 0), 100);
  const formatCurrency = (v) =>
    new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
      Number(v || 0)
    );
  const stripHtml = (html) => html.replace(/<[^>]*>?/gm, "").trim();

  // ---------- Clean HTML ----------
function cleanHTML(input = "") {
  if (!input) return "";

  let output = String(input);

  // Normalize simple breaks and paragraphs
  output = output.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n");

  // Ordered lists → "1.  Item"
  output = output.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, list) => {
    let counter = 0;
    return list
      .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, li) => {
        counter++;
        const cleanItem = li.replace(/<[^>]+>/g, "").trim().replace(/\s+/g, " ");
        return `${counter}.  ${cleanItem}\n`;
      })
      .trim();
  });

  // Unordered lists → "·  Item" (2 spaces for correct alignment)
  output = output.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, list) => {
    return list
      .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, li) => {
        const cleanItem = li.replace(/<[^>]+>/g, "").trim().replace(/\s+/g, " ");
        return `·  ${cleanItem}\n`;
      })
      .trim();
  });

  // Strip any remaining tags and normalize spacing
  output = output
    .replace(/<\/?(strong|em|u|span|div|h\d|blockquote|a|b|i)[^>]*>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return output;
}


  // ---------- Wrap long text ----------
  /*
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

*/

function wrapDesc(text, maxLen = 40) {
  if (!text) return ["—"];

  const normalized = cleanHTML(String(text)).replace(/\r\n?/g, "\n");
  const firstPass = normalized
    .split(/\n+/g)
    .map((s) => s.trim())
    .filter(Boolean);

  const out = [];

  for (const chunk of firstPass) {
    let s = chunk;
    while (s.length > maxLen) {
      let cut = s.lastIndexOf(" ", maxLen);
      if (cut < Math.floor(maxLen * 0.6)) cut = maxLen;

      // 🔧 Trim only *extra* commas/dots if followed by another punctuation
      let part = s
        .slice(0, cut)
        .replace(/([.,]){2,}$/g, "$1") // collapse "..", ",," etc. to one
        .replace(/([.,]){1}\s*$/g, "$1") // keep one punctuation mark
        .trim();

      out.push(part.toUpperCase());
      s = s.slice(cut).trim();
    }

    if (s) {
      let cleanTail = s
        .replace(/([.,]){2,}$/g, "$1")
        .replace(/([.,]){1}\s*$/g, "$1")
        .trim();
      out.push(cleanTail.toUpperCase());
    }
  }

  return out.length ? out : ["—"];
}




  // ---------- totals ----------
  const totals = useMemo(() => {
    const subtotal = rows.reduce((acc, r) => {
      const qty = Number(r.qty || 0);
      const unit = Number(r.unit || 0);
      const disc = clampPct(r.discount);
      const base = qty * unit;
      return acc + base * (1 - disc / 100);
    }, 0);
    const totalDiscPct = clampPct(formData.totalDiscount);
    const subtotalAfterTotalDiscount = subtotal * (1 - totalDiscPct / 100);
    const vatRate = selectedCurrency === "USD" ? 0 : 0.15;
    const vatAmount = subtotalAfterTotalDiscount * vatRate;
    const total = subtotalAfterTotalDiscount + vatAmount;
    return {
      subtotal,
      subtotalAfterTotalDiscount,
      vatAmount,
      total,
      totalDiscPct,
    };
  }, [rows, selectedCurrency, formData.totalDiscount]);

  // ---------- fetch quotation ----------
  useEffect(() => {
    const getQuotation = async () => {
      try {
        const res = await fetch(`${domain}/api/quotation/${params.id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setQuotation(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    getQuotation();
  }, [params.id, updateTrigger]);

  useEffect(() => {
    const getUsers = async () => {
      try {
        const res = await fetch(`${domain}/api/allUsers`);
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        console.error(err);
      }
    };
    getUsers();
  }, []);

  // ---------- load quotation ----------
  useEffect(() => {
    if (!quotation) return;
    setFormData({
      quotationId: quotation.quotationId,
      user: quotation.user?._id || "",
      saleName: quotation.sale?.name || "",
      clientName: quotation.client?.name || "",
      projectName: quotation.projectName || "",
      projectLA: quotation.projectLA || "",
      paymentTerm: quotation.paymentTerm || "",
      paymentDelivery: quotation.paymentDelivery || "",
      validityPeriod: quotation.validityPeriod || "",
      note: quotation.note || "",
      excluding: quotation.excluding || "",
      totalDiscount: Number(quotation.totalDiscount || 0),
    });
    setSelectedCurrency(quotation.currency || "USD");

    const newRows = [];
    const newShow = [];
    let prev;
    (quotation.products || []).forEach((p, i) => {
      const norm = (p.titleAbove || "").trim();
      const isBoundary = !!norm && norm !== prev;
      newRows.push({
        _id: p._id,
        id: i + 1,
        number: i + 1,
        productCode: p.productCode || "",
        qty: p.qty || "",
        unit: p.unit || "",
        discount: Number(p.discount || 0),
        unitPrice: Number(p.unitPrice || 0),
        description: p.description || "",
        titleAbove: isBoundary ? norm : "",
      });
      newShow.push(isBoundary);
      if (isBoundary) prev = norm;
    });
    setRows(newRows);
    setShowTitles(newShow);
  }, [quotation]);

  // ---------- row handlers ----------
  const addRow = () => {
    setRows((p) => [
      ...p,
      {
        id: p.length + 1,
        number: p.length + 1,
        productCode: "",
        description: "",
        qty: "",
        unit: "",
        discount: 0,
        unitPrice: 0,
        titleAbove: "",
      },
    ]);
    setShowTitles((p) => [...p, false]);
  };

  const deleteRow = (i) => {
    const updated = rows.filter((_, idx) => idx !== i);
    const renumbered = updated.map((r, idx) => ({
      ...r,
      id: idx + 1,
      number: idx + 1,
    }));
    setRows(renumbered);
    setShowTitles((prev) => prev.filter((_, idx) => idx !== i));
  };

  const toggleTitleForRow = (i) =>
    setShowTitles((p) => p.map((v, idx) => (i === idx ? !v : v)));
  const handleTitleChange = (i, v) =>
    setRows((p) => p.map((r, idx) => (i === idx ? { ...r, titleAbove: v } : r)));

  const handleRowInputChange = (index, field, value) => {
    const numeric = ["qty", "unit", "discount"];
    const clean = numeric.includes(field)
      ? String(value).replace(/[^\d.]/g, "")
      : value;
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== index) return r;
        const next = { ...r, [field]: clean };
        const qty = Number(field === "qty" ? clean : r.qty);
        const unit = Number(field === "unit" ? clean : r.unit);
        const disc = clampPct(field === "discount" ? clean : r.discount);
        next.unitPrice = qty * unit * (1 - disc / 100);
        next.discount = disc;
        return next;
      })
    );
  };

  const handleInputChange = (f, v) =>
    setFormData((p) => ({ ...p, [f]: v }));

  // ---------- submit ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateQuotationApprove({
        id: params.id,
        ...formData,
        products: rows,
        currency: selectedCurrency,
        totalDiscount: clampPct(formData.totalDiscount),
        subtotal: totals.subtotal,
        subtotalAfterTotalDiscount: totals.subtotalAfterTotalDiscount,
        vatAmount: totals.vatAmount,
        totalPrice: totals.total,
      });
      alert("Approval saved!");
      setUpdateTrigger((p) => !p);
    } catch (err) {
      console.error("Approval update failed:", err);
      alert("Update failed!");
    }
  };

  // ---------- document builder ----------
  const buildDocumentData = () => {
    const adminName = 
      users?.find((u) => u._id === formData.user)?.username || "N/A";
    const data = buildQuotationPayload(quotation, selectedCurrency, adminName);

    data.Sections?.forEach((section) => {
      section.Items?.forEach((item) => {
        item.DescriptionRich = wrapDesc(
          item.DescriptionRich || item.Description || ""
        );
      });
    });

    // Fields matching PDF detection logic
    const subtotal = totals.subtotal;
    const subtotalAfter = totals.subtotalAfterTotalDiscount;
    const totalPrice = totals.total;
    const discountPct = clampPct(formData.totalDiscount);
    const discountAmt = subtotal - subtotalAfter;

    data.discountPer = discountPct;
    data.discountAmount = discountAmt;
    data.Subtotal = subtotal;
    data.SubtotalAfterTotalDiscount = subtotalAfter;
    data.TotalPrice = subtotal;
    data.NetPrice = totalPrice;
    data.TotalDiscountPct = discountPct;

    return data;
  };

  const downloadDoc = async (endpoint, ext) => {
    try {
      const data = buildDocumentData();
      const res = await fetch(`${domain}/api/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`Server ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const qNum = quotation.quotationId || "Quotation";
      const a = document.createElement("a");
      a.href = url;
      a.download = `${qNum}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert(`${ext.toUpperCase()} download failed.`);
    }
  };

  // ---------- render ----------
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading approval: {error}</div>;
  if (!quotation) return null;

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className={styles.container}>
          <div>Quotation ID: {formData.quotationId}</div>
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginTop: 8,
            }}
          >
            <button
              type="button"
              className={styles.DownloadButton}
              onClick={() => downloadDoc("loadQuoWord", "docx")}
            >
              Download WORD
            </button>
            <button
              type="button"
              className={styles.DownloadButton}
              onClick={() => downloadDoc("loadQuoPdf", "pdf")}
            >
              Download PDF
            </button>
          </div>

          <div className={styles.form1} style={{ marginTop: 12 }}>
            <div className={styles.inputContainer}>
              <label className={styles.label}>Admin Name:</label>
              <select
                value={formData.user}
                onChange={(e) =>
                  handleInputChange("user", e.target.value)
                }
              >
                <option value="">Select An Admin</option>
                {users
                  ?.filter((u) => ADMIN.has(u.role))
                  .map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.username}
                    </option>
                  ))}
              </select>
            </div>
            <div className={styles.inputContainer}>
              <label className={styles.label}>
                Sales Representative:
              </label>
              <input
                type="text"
                className={styles.input}
                value={formData.saleName}
                readOnly
              />
            </div>
            <div className={styles.inputContainer}>
              <label className={styles.label}>Client Name:</label>
              <input
                type="text"
                className={styles.input}
                value={formData.clientName}
                readOnly
              />
            </div>
            <div className={styles.inputContainer}>
              <label className={styles.label}>Project Name:</label>
              <input
                className={styles.input}
                value={formData.projectName}
                readOnly
              />
            </div>
            <div className={styles.inputContainer}>
              <label className={styles.label}>
                Project Location:
              </label>
              <input
                className={styles.input}
                value={formData.projectLA}
                readOnly
              />
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className={styles.container}>
          <div className={styles.form2}>
            <p className={styles.title}>Products</p>
            <table className={styles.table}>
              <thead>
                <tr>
                  <td>No</td>
                  <td>Code</td>
                  <td>Description</td>
                  <td>Qty</td>
                  <td>Unit</td>
                  <td>Discount%</td>
                  <td>Total</td>
                  <td>Actions</td>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <React.Fragment key={r.id}>
                    {showTitles[i] && (
                      <tr
                        className={`${styles.row} ${styles.titleRow}`}
                      >
                        <td colSpan={8}>
                          <input
                            type="text"
                            placeholder="Section Title"
                            value={r.titleAbove}
                            onChange={(e) =>
                              handleTitleChange(i, e.target.value)
                            }
                            className={styles.titleInput}
                          />
                        </td>
                      </tr>
                    )}
                    <tr className={styles.row}>
                      <td>{String(r.number).padStart(3, "0")}</td>
                      <td>
                        <input
                          className={styles.input1}
                          value={r.productCode}
                          onChange={(e) =>
                            handleRowInputChange(
                              i,
                              "productCode",
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className={styles.descButton}
                          onClick={() => {
                            setActiveDescIndex(i);
                            setRichDescValue(r.description || "");
                            setIsDescPopupOpen(true);
                          }}
                        >
                          <FaEdit style={{ marginRight: 6 }} />
                          {r.description
                            ? stripHtml(r.description).slice(0, 35) +
                              (stripHtml(r.description).length > 35
                                ? "..."
                                : "")
                            : "Add Description"}
                        </button>
                      </td>
                      <td>
                        <input
                          className={styles.input1}
                          value={r.qty}
                          onChange={(e) =>
                            handleRowInputChange(i, "qty", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          className={styles.input1}
                          value={r.unit}
                          onChange={(e) =>
                            handleRowInputChange(i, "unit", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          className={styles.input1}
                          value={r.discount}
                          onChange={(e) =>
                            handleRowInputChange(
                              i,
                              "discount",
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td>{formatCurrency(r.unitPrice)}</td>
                      <td className={styles.actionsCell}>
  {/* Title toggle */}
  <button
    type="button"
    className={`${styles.titleButton} ${
      showTitles[i] ? styles.titleButtonActive : ""
    }`}
    onClick={() => toggleTitleForRow(i)}
    title={showTitles[i] ? "Hide title" : "Add title above row"}
  >
    <FaTag size={12} />
    Title
  </button>

  {/* Add or Delete row */}
  {i === rows.length - 1 ? (
    <button
      type="button"
      className={`${styles.iconButton} ${styles.addButton}`}
      onClick={addRow}
    >
      <FaPlus />
    </button>
  ) : (
    <button
      type="button"
      className={`${styles.iconButton} ${styles.deleteButton}`}
      onClick={() => deleteRow(i)}
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

            <div className={styles.inputContainer} style={{ marginTop: 12 }}>
              <label className={styles.label}>
                Total Discount % (optional):
              </label>
              <input
                className={styles.input}
                placeholder="0"
                value={formData.totalDiscount}
                onChange={(e) =>
                  handleInputChange("totalDiscount", e.target.value)
                }
              />
            </div>
          </div>
        </div>

        {/* Totals */}
        <div className={styles.container}>
          <div className={styles.form5}>
            <p>Subtotal: {formatCurrency(totals.subtotal)}</p>
            <p>
              Subtotal after Total Discount:{" "}
              {formatCurrency(totals.subtotalAfterTotalDiscount)}
            </p>
            <p>
              VAT ({selectedCurrency === "USD" ? "0%" : "15%"}):{" "}
              {formatCurrency(totals.vatAmount)}
            </p>
            <p>Total (Incl. VAT): {formatCurrency(totals.total)}</p>
          </div>
        </div>

        {/* Notes */}
        <div className={styles.container}>
          <div className={styles.form1}>
            <div className={styles.inputContainer}>
              <label className={styles.label}>Payment Term:</label>
              <textarea
                className={styles.input}
                value={formData.paymentTerm}
                onChange={(e) =>
                  handleInputChange("paymentTerm", e.target.value)
                }
              />
            </div>
            <div className={styles.inputContainer}>
              <label className={styles.label}>Payment Delivery:</label>
              <textarea
                className={styles.input}
                value={formData.paymentDelivery}
                onChange={(e) =>
                  handleInputChange("paymentDelivery", e.target.value)
                }
              />
            </div>
            <div className={styles.inputContainer}>
              <label className={styles.label}>Validity Period:</label>
              <textarea
                className={styles.input}
                value={formData.validityPeriod}
                onChange={(e) =>
                  handleInputChange("validityPeriod", e.target.value)
                }
              />
            </div>
            <div className={styles.inputContainer}>
              <label className={styles.label}>Note:</label>
              <textarea
                className={styles.input}
                value={formData.note}
                onChange={(e) =>
                  handleInputChange("note", e.target.value)
                }
              />
            </div>
            <div className={styles.inputContainer}>
              <label className={styles.label}>Excluding:</label>
              <textarea
                className={styles.input}
                value={formData.excluding}
                onChange={(e) =>
                  handleInputChange("excluding", e.target.value)
                }
              />
            </div>

            <button type="submit">Update</button>
          </div>
        </div>
      </form>

      {/* Description Popup */}
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
            <h2 style={{ color: "#fff", margin: 0 }}>
              Edit Product Description
            </h2>

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

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 12,
              }}
            >
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
                    handleRowInputChange(
                      activeDescIndex,
                      "description",
                      richDescValue
                    );
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

export default SingleApprovePage;
