"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import styles from "@/app/ui/dashboard/approve/approve.module.css";
import { editQuotation, updateQuotation } from "@/app/lib/actions";

const SingleQuotation = ({ params }) => {
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [quotation, setQuotation] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    clientName: "",
    projectName: "",
    projectLA: "",
    products: [],
    paymentTerm: "",
    paymentDelivery: "",
    validityPeriod: "",
    note: "",
    excluding: "",
    totalPrice: "",
  });

  const [rows, setRows] = useState([]);

  // Preview state (popup)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);

  // ---------- helpers ----------
  const formatCurrency = (value) => {
    const n = Number(value || 0);
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  };

  // utility to force "0.00" style (string)
  const to2 = (v) => Number(v || 0).toFixed(2);

  const totals = useMemo(() => {
    const subtotal = rows.reduce((acc, r) => acc + (Number(r.unitPrice) || 0), 0);
    const vatRate = selectedCurrency === "USD" ? 0 : 15; // unchanged per your request
    const vatAmount = subtotal * vatRate;
    const total = subtotal + vatAmount;
    return {
      totalUnitPrice: Number(subtotal.toFixed(2)),
      vatAmount: Number(vatAmount.toFixed(2)),
      totalUnitPriceWithVAT: Number(total.toFixed(2)),
    };
  }, [rows, selectedCurrency]);

  const buildDocumentData = (mode = "word-to-pdf") => {
    if (!rows || rows.length === 0) throw new Error("No product rows available.");
    if (!formData || !quotation) throw new Error("Missing required form data or quotation details.");

    const {
      totalUnitPrice: Subtotal,
      vatAmount: VatPrice,
      totalUnitPriceWithVAT: NetPrice,
    } = totals;

    const vatRate = selectedCurrency === "USD" ? 0 : 15; // unchanged

    return {
      renderMode: mode, // "word-to-pdf" (exact from DOCX) or "pdf-template" (pdf-lib)
      templateId: "quotation-v1",
      QuotationNumber: formData.quotationId || "No Quotation ID",
      ClientName: formData.clientName || "No Client Name",
      CreatedAt: new Date(quotation.createdAt || Date.now()).toISOString().split("T")[0],
      ProjectName: formData.projectName || "No Project Name",
      ProjectLA: formData.projectLA || "No Project Location Address",
      SaleName: quotation.sale?.name || "No Sales Representative Name",
      ClientContactName: quotation.client?.contactName || "No Client Contact Name",
      userName: quotation.user?.username || "No User Name",
      ClientPhone: quotation.client?.phone || "No Client Phone",
      UserPhone: quotation.sale?.phone || "No Sales Representative Phone",
      UserEmail: quotation.sale?.email || "No Sales Representative Email",
      UserAddress: quotation.sale?.address || "No Sales Representative Address",
      ClientContactMobile: quotation.client?.contactMobile || "No Client Contact Mobile",
      ClientEmail: quotation.client?.email || "No Client Email",
      ClientAddress: quotation.client?.address || "No Client Address",
      Currency: selectedCurrency,

      // ---- ONLY FORMATTING CHANGED BELOW ----
      // Send as strings with 2 decimals so the template shows 0.00 style
      TotalPrice: formatCurrency(Subtotal),   // e.g. "4,800.00"
    VatRate: Number(vatRate.toFixed(2)),    // unchanged
     VatPrice: formatCurrency(VatPrice),     // e.g. "720.00"
    NetPrice: formatCurrency(NetPrice), 
      // ---------------------------------------

      ValidityPeriod: formData.validityPeriod || "No Validity Preiod",
      PaymentTerm: formData.paymentTerm || "No Payment Term",
      PaymentDelivery: formData.paymentDelivery || "No Delivery Term",
      Note: formData.note || "No Note",
      Excluding: formData.excluding || "No Exclusions",
      Products: rows.map((p, idx) => ({
        Number: (idx + 1).toString().padStart(3, "0"),
        ProductCode: (p.productCode || "—").toUpperCase(),
        UnitPrice: Number((p.unitPrice || 0).toFixed(2)), // total per row
        Unit: Number((p.unit || 0).toFixed(2)),
        Qty: Number(p.qty || 0),
        Description: (p.description || "—").toUpperCase(),
      })),

      // (keeping your second Products mapping as in your source)
      Products: rows.map((p, idx) => ({
        Number: (idx + 1).toString().padStart(3, "0"),
        ProductCode: (p.productCode || "—").toUpperCase(),
        UnitPrice: formatCurrency(p.unitPrice || 0), // formatted: "3,450.00"
        Unit: formatCurrency(p.unit || 0), // formatted: "250.00"
        Qty: Number(p.qty || 0),
        Description: (p.description || "—").toUpperCase(),
      })),
    };
  };

  // ---------- data fetch ----------
  useEffect(() => {
    const getQuotationById = async () => {
      try {
        const res = await fetch(`/api/quotation/${params.id}`, { method: "GET" });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
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
    if (!quotation) return;

    setFormData({
      quotationId: quotation.quotationId,
      userName: quotation.user?.username ?? "N/A",
      saleName: quotation.sale?.name ?? "N/A",
      clientName: quotation.client?.name ?? "N/A",
      projectName: quotation.projectName || "",
      projectLA: quotation.projectLA || "",
      products: quotation.products || [],
      paymentTerm: quotation.paymentTerm || "",
      paymentDelivery: quotation.paymentDelivery || "",
      validityPeriod: quotation.validityPeriod || "",
      note: quotation.note || "",
      excluding: quotation.excluding || "",
      totalPrice: quotation.totalPrice || "",
    });

    setSelectedCurrency(quotation.currency || "USD");

    const newRows = (quotation.products || []).map((product, index) => ({
      _id: product._id,
      id: index + 1,
      number: index + 1,
      productCode: product.productCode || "",
      unitPrice: Number(product.unitPrice || 0), // total per row
      unit: product.unit || "", // unit price
      qty: product.qty || "",
      description: product.description || "",
    }));
    setRows(newRows);
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
      unitPrice: 0,
    };
    setRows((prev) => [...prev, newRow]);
  };

  const deleteRow = (index) => {
    const updated = rows.filter((_, i) => i !== index);
    const renumbered = updated.map((r, i) => ({ ...r, id: i + 1, number: i + 1 }));
    setRows(renumbered);
  };

  const handleRowInputChange = (index, fieldName, value) => {
    const clean = fieldName === "qty" || fieldName === "unit" ? value.replace(/[^\d.]/g, "") : value;

    setRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;

        const next = { ...row, [fieldName]: clean };
        // recompute total per line when qty or unit changes
        if (fieldName === "qty" && !isNaN(clean) && !isNaN(row.unit)) {
          next.unitPrice = Number(clean || 0) * Number(row.unit || 0);
        } else if (fieldName === "unit" && !isNaN(clean) && !isNaN(row.qty)) {
          next.unitPrice = Number(clean || 0) * Number(row.qty || 0);
        }
        return next;
      })
    );
  };

  // ---------- simple form ops ----------
  const handleInputChange = (fieldName, value) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const rowInputs = rows.map((row) => ({
      productCode: row.productCode,
      unitPrice: row.unitPrice,
      unit: row.unit,
      qty: row.qty,
      description: row.description,
    }));

    await updateQuotation({
      id: params.id,
      ...formData,
      products: rowInputs,
    });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    const rowInputs = rows.map((row) => ({
      productCode: row.productCode,
      unitPrice: row.unitPrice,
      unit: row.unit,
      qty: row.qty,
      description: row.description,
    }));

    await editQuotation({
      id: params.id,
      ...formData,
      products: rowInputs,
      currency: selectedCurrency,
      totalPrice: Number(totals.totalUnitPrice),
    });
  };

  // ---------- preview / download / upload ----------
  const previewQuotationDocument = async (asPopup = false) => {
    try {
      const payload = buildDocumentData("word-to-pdf");
      const res = await fetch(`/api/loadQuoPdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Server responded ${res.status}: ${t}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      if (asPopup) {
        // show inside modal
        if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        setPdfUrl(url);
        setIsPreviewOpen(true);
      } else {
        // open in new tab/page
        window.open(url, "_blank");
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      }
    } catch (err) {
      alert(err.message || "Failed to preview PDF.");
    }
  };

  const uploadQuotationDocument = async () => {
    try {
      const payload = buildDocumentData("word-to-pdf");
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
      alert(err.message || "Upload failed.");
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
              <input
                type="text"
                className={styles.input}
                value={formData.clientName}
                onChange={(e) => handleInputChange("clientName", e.target.value)}
                readOnly
              />
            </div>
            <div className={styles.inputContainer}>
              <label className={styles.label}>Sale Representative Name:</label>
              <input
                type="text"
                className={styles.input}
                value={formData.saleName}
                onChange={(e) => handleInputChange("saleName", e.target.value)}
                readOnly
              />
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
                  <td>Total Price</td>
                  <td></td>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id} className={styles.row}>
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
                      <textarea
                        className={`${styles.input1} ${styles.textarea}`}
                        placeholder="Description"
                        value={row.description}
                        onChange={(e) => handleRowInputChange(index, "description", e.target.value)}
                      />
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
                    </td>
                    <td>{formatCurrency(Number(row.unitPrice) || 0)}</td>
                    <td>
                      {index === rows.length - 1 ? (
                        <button type="button" className={`${styles.iconButton} ${styles.addButton}`} onClick={addRow}>
                          <FaPlus />
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={`${styles.iconButton} ${styles.deleteButton}`}
                          onClick={() => deleteRow(index)}
                        >
                          <FaTrash />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.container}>
          <div className={styles.form5}>
            <p>Total Unit Price (Excluding VAT): {formatCurrency(totals.totalUnitPrice)}</p>
            <p>VAT ({selectedCurrency === "USD" ? "0%" : "15%"}): {formatCurrency(totals.vatAmount)}</p>
            <p>Total Unit Price (Including VAT): {formatCurrency(totals.totalUnitPriceWithVAT)}</p>
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

            <button type="submit">Update</button>
          </div>
        </div>
      </form>

      {/* ---------- Popup modal ---------- */}
      {isPreviewOpen && (
        <div
          onClick={() => {
            setIsPreviewOpen(false);
            if (pdfUrl) {
              URL.revokeObjectURL(pdfUrl);
              setPdfUrl(null);
            }
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
                  a.download = `Quotation_${formData.quotationId || "Preview"}.pdf`;
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
                    // don’t revoke immediately for the new tab
                  }
                }}
              >
                Open in new tab
              </button>

              <button
                onClick={() => {
                  setIsPreviewOpen(false);
                  if (pdfUrl) {
                    URL.revokeObjectURL(pdfUrl);
                    setPdfUrl(null);
                  }
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
    </div>
  );
};

export default SingleQuotation;
