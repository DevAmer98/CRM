"use client";
import React, { useState, useEffect } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import styles from "@/app/ui/dashboard/approve/approve.module.css";
import { updateQuotationApprove } from "@/app/lib/actions";

const SingleApprovePage = ({ params }) => {
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [quotation, setQuotation] = useState(null);
  const [users, setUsers] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setLoading] = useState(true);
  const [isUploaded, setIsUploaded] = useState(false);
  const [updateTrigger, setUpdateTrigger] = useState(false);

  const domain = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const [formData, setFormData] = useState({
    sale: "",
    clientName: "",
    projectName: "",
    projectLA: "",
    products: [],
    paymentTerm: "",
    paymentDelivery: "",
    note: "",
    excluding: "",
  });

  // Rows we edit in this page
  const [rows, setRows] = useState([]);
  // Which rows should display a section title above them (boundary rows)
  const [showTitles, setShowTitles] = useState([]);

  // -------- helpers --------
  const calcTotals = () => {
    const totalUnitPrice = rows.reduce(
      (sum, r) => sum + (Number(r.unitPrice) || 0),
      0
    );
    const vatRate = selectedCurrency === "USD" ? 0 : 0.15;
    const vatAmount = totalUnitPrice * vatRate;
    const totalUnitPriceWithVAT = totalUnitPrice + vatAmount;
    return {
      totalUnitPrice: totalUnitPrice.toFixed(2),
      vatAmount: vatAmount.toFixed(2),
      totalUnitPriceWithVAT: totalUnitPriceWithVAT.toFixed(2),
    };
  };

  // Build products list for doc/export: include title ONLY for first row of each section
  const buildProductsForDoc = () => {
    const out = [];
    let last = undefined;

    rows.forEach((r, idx) => {
      let title;
      if (showTitles[idx]) {
        const norm = (r.titleAbove || "").trim();
        if (norm && norm !== last) {
          title = norm;
          last = norm;
        }
      }
      out.push({
        Number: (idx + 1).toString().padStart(3, "0"),
        ProductCode: r.productCode || "—",
        UnitPrice: Number(r.unitPrice || 0),
        Unit: r.unit || 0,
        Qty: r.qty || 0,
        Description: r.description || "—",
        TitleAbove: title,
        titleAbove: title,
      });
    });

    return out;
  };

  // Build products list for submit/update
  const buildProductsForSubmit = () => {
    const out = [];
    let last = undefined;
    rows.forEach((r, idx) => {
      let title;
      if (showTitles[idx]) {
        const norm = (r.titleAbove || "").trim();
        if (norm && norm !== last) {
          title = norm;
          last = norm;
        }
      }
      out.push({
        productCode: r.productCode,
        unitPrice: r.unitPrice,
        unit: r.unit,
        qty: r.qty,
        description: r.description,
        titleAbove: title, // normalized boundary only
      });
    });
    return out;
  };

  // -------- data fetch --------
  useEffect(() => {
    const getQuotationById = async () => {
      try {
        const response = await fetch(`${domain}/api/quotation/${params.id}`, {
          method: "GET",
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setQuotation(data);
      } catch (err) {
        setError(`Fetching failed: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    getQuotationById();
  }, [params.id, updateTrigger]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${domain}/api/allUsers`, {
          method: "GET",
        });
        const data = await response.json();
        setUsers(data);
        setLoading(false);
      } catch (e) {
        console.error("Error fetching users:", e);
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Initialize form + rows with title boundary detection
  useEffect(() => {
    if (!quotation) return;

    setFormData({
      quotationId: quotation.quotationId,
      user: quotation.user?._id,
      saleName: quotation.sale ? quotation.sale.name : "",
      clientName: quotation.client ? quotation.client.name : "",
      projectName: quotation.projectName,
      projectLA: quotation.projectLA,
      products: quotation.products,
      paymentTerm: quotation.paymentTerm,
      paymentDelivery: quotation.paymentDelivery,
      note: quotation.note,
      excluding: quotation.excluding,
    });

    setSelectedCurrency(quotation.currency || "USD");

    const nextRows = [];
    const nextShow = [];
    let prev = undefined;

    (quotation.products || []).forEach((p, idx) => {
      const norm = (p.titleAbove || "").trim();
      const isBoundary = !!norm && norm !== prev;

      nextRows.push({
        _id: p._id,
        id: idx + 1,
        number: idx + 1,
        productCode: p.productCode || "",
        unitPrice: Number(p.unitPrice || 0),
        unit: p.unit || "",
        qty: p.qty || "",
        description: p.description || "",
        titleAbove: isBoundary ? norm : "", // only keep value at boundary
      });
      nextShow.push(isBoundary);

      if (isBoundary) prev = norm;
    });

    setRows(nextRows);
    setShowTitles(nextShow);
  }, [quotation]);

  // -------- row ops --------
  const addRow = () => {
    const newRow = {
      id: rows.length + 1,
      number: rows.length + 1,
      productCode: "",
      description: "",
      qty: "",
      unit: "",
      unitPrice: 0,
      titleAbove: "",
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

  const handleRowInputChange = (index, fieldName, value) => {
    setRows((prevRows) =>
      prevRows.map((row, i) => {
        if (i !== index) return row;
        const next = {
          ...row,
          [fieldName]: value,
        };
        if (fieldName === "qty" && !isNaN(value) && !isNaN(row.unit)) {
          next.unitPrice = Number(value) * Number(row.unit);
        } else if (fieldName === "unit" && !isNaN(value) && !isNaN(row.qty)) {
          next.unitPrice = Number(value) * Number(row.qty);
        }
        return next;
      })
    );
  };

  // Titles in approve page are **read-only**: we just display them (no toggles/edit).
  // If you DO want to allow editing, add a toggle + input similar to your Add/Edit pages.

  // -------- form ops --------
  const handleInputChange = (fieldName, value) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleAdminChange = (e) => {
    setFormData((prev) => ({ ...prev, user: e.target.value }));
  };

  // -------- submit --------
  const handleSubmit = async (e) => {
    e.preventDefault();
    const rowInputs = buildProductsForSubmit();

    try {
      await updateQuotationApprove({
        id: params.id,
        ...formData,
        products: rowInputs,
      });
      setUpdateTrigger((p) => !p);
    } catch (err) {
      console.error("Failed to update!", err);
    }
  };

  // -------- downloads / upload --------
  const downloadQuotationPdfDocument = async () => {
    try {
      const totals = calcTotals();
      const vatRate = selectedCurrency === "USD" ? 0 : 0.15;

      const documentData = {
        QuotationNumber: quotation.quotationId,
        ClientName: quotation.client?.name,
        userName: quotation.user?.username,
        ClientPhone: quotation.client?.phone || "No address provided",
        ClientEmail: quotation.client?.email || "No contact info",
        ClientAddress: quotation.client?.address || "No address info",
        ClientContactMobile: quotation.client?.contactMobile || "No contact info",
        ClientContactName: quotation.client?.contactName || "No contact info",
        SaleName: quotation.sale?.name || "No address provided",
        UserPhone: quotation.sale?.phone || "No address provided",
        UserEmail: quotation.sale?.email || "No contact info",
        UserAddress: quotation.sale?.address || "No address info",
        ProjectName: quotation.projectName,
        ProjectLA: quotation.projectLA,
        Products: buildProductsForDoc(), // <-- includes TitleAbove only at boundaries
        CurrencySymbol: selectedCurrency === "USD" ? "$" : "SAR",
        TotalPrice: totals.totalUnitPrice,
        VatRate: vatRate.toFixed(2),
        VatPrice: totals.vatAmount,
        NetPrice: totals.totalUnitPriceWithVAT,
        PaymentTerm: quotation.paymentTerm,
        PaymentDelivery: quotation.paymentDelivery,
        Note: quotation.note,
        Excluding: quotation.excluding,
        CreatedAt: quotation.createdAt
          ? new Date(quotation.createdAt).toDateString().slice(4, 16)
          : "",
      };

      const response = await fetch(`${domain}/api/loadQuoPdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(documentData),
      });

      if (!response.ok)
        throw new Error(`Server responded with status: ${response.status}`);

      const fileBlob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(fileBlob);
      link.download = `Quotation_${documentData.QuotationNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading the document:", error);
    }
  };

  const downloadQuotationWordDocument = async () => {
    try {
      const totals = calcTotals();
      const vatRate = selectedCurrency === "USD" ? 0 : 0.15;

      const documentData = {
        QuotationNumber: quotation.quotationId,
        ClientName: quotation.client?.name,
        userName: quotation.user?.username,
        ClientPhone: quotation.client?.phone || "No address provided",
        ClientEmail: quotation.client?.email || "No contact info",
        ClientAddress: quotation.client?.address || "No address info",
        ClientContactMobile: quotation.client?.contactMobile || "No contact info",
        ClientContactName: quotation.client?.contactName || "No contact info",
        SaleName: quotation.sale?.name || "No address provided",
        UserPhone: quotation.sale?.phone || "No address provided",
        UserEmail: quotation.sale?.email || "No contact info",
        UserAddress: quotation.sale?.address || "No address info",
        ProjectName: quotation.projectName,
        ProjectLA: quotation.projectLA,
        Products: buildProductsForDoc().map((p) => ({
          ...p,
          UnitPrice: Number(p.UnitPrice).toFixed(2),
        })),
        Currency: selectedCurrency === "USD" ? "$" : "SAR",
        TotalPrice: totals.totalUnitPrice,
        VatRate: vatRate.toFixed(2),
        VatPrice: totals.vatAmount,
        NetPrice: totals.totalUnitPriceWithVAT,
        PaymentTerm: quotation.paymentTerm,
        PaymentDelivery: quotation.paymentDelivery,
        Note: quotation.note,
        Excluding: quotation.excluding,
        CreatedAt: quotation.createdAt
          ? new Date(quotation.createdAt).toDateString().slice(4, 16)
          : "",
      };

      const response = await fetch(`${domain}/api/loadQuoWord`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(documentData),
      });

      if (!response.ok)
        throw new Error(`Server responded with status: ${response.status}`);

      const fileBlob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(fileBlob);
      link.download = `Quotation_${documentData.QuotationNumber}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading the document:", error);
    }
  };

  const uploadQuotationDocument = async () => {
    try {
      if (!rows?.length) throw new Error("No product rows available.");
      if (!formData || !quotation)
        throw new Error("Missing form or quotation details.");

      const totals = calcTotals();
      const vatRate = selectedCurrency === "USD" ? 0 : 0.15;

      const documentData = {
        QuotationNumber: formData.quotationId || "No Quotation ID",
        ClientName: formData.clientName || "No Client Name",
        CreatedAt: new Date(quotation.createdAt || Date.now())
          .toISOString()
          .split("T")[0],
        ProjectName: formData.projectName || "No Project Name",
        ProjectLA: formData.projectLA || "No Project Location Address",
        SaleName: quotation.sale?.name || "No Sales Representative Name",
        ClientContactName:
          quotation.client?.contactName || "No Client Contact Name",
        userName: quotation.user?.username || "No User Name",
        ClientPhone: quotation.client?.phone || "No Client Phone",
        UserPhone: quotation.sale?.phone || "No Sales Representative Phone",
        UserEmail: quotation.sale?.email || "No Sales Representative Email",
        UserAddress:
          quotation.sale?.address || "No Sales Representative Address",
        ClientContactMobile:
          quotation.client?.contactMobile || "No Client Contact Mobile",
        ClientEmail: quotation.client?.email || "No Client Email",
        ClientAddress: quotation.client?.address || "No Client Address",
        Currency: selectedCurrency === "USD" ? "$" : "SAR",
        TotalPrice: totals.totalUnitPrice,
        VatRate: vatRate.toFixed(2),
        VatPrice: totals.vatAmount,
        NetPrice: totals.totalUnitPriceWithVAT,
        PaymentTerm: formData.paymentTerm || "No Payment Term",
        PaymentDelivery: formData.paymentDelivery || "No Delivery Term",
        Note: formData.note || "No Note",
        Excluding: formData.excluding || "No Exclusions",
        Products: buildProductsForDoc(), // carries TitleAbove at boundaries
      };

      const response = await fetch(`${domain}/api/loadQuoToSynology`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(documentData),
      });

      if (!response.ok) {
        const t = await response.text();
        throw new Error(
          `Server responded with status: ${response.status}, message: ${t}`
        );
      }

      setIsUploaded(true);
      alert("PDF uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      alert(error?.message || "Upload failed.");
    }
  };

  // -------- render --------
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading approve: {error}</div>;
  if (!quotation) return null;

  const totals = calcTotals();

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className={styles.container}>
          <div className={styles.container}>Quotation ID: {formData.quotationId}</div>

          <button
            type="button"
            className={styles.DownloadButton}
            onClick={downloadQuotationWordDocument}
          >
            Download Quotation WORD ...
          </button>
          <button
            type="button"
            className={styles.DownloadButton}
            onClick={downloadQuotationPdfDocument}
          >
            Download Quotation PDF...
          </button>
          <button
            type="button"
            className={styles.DownloadButton}
            onClick={uploadQuotationDocument}
            disabled={isUploaded}
          >
            {isUploaded ? "Uploaded" : "Upload Quotation to Synology"}
          </button>

          <div className={styles.form1}>
            <input type="hidden" name="id" value={params.id} />

            <div className={styles.selectContainer}>
              <div className={styles.inputContainer}>
                <label htmlFor="adminName" className={styles.label}>
                  Admin Name:
                </label>
                <select name="user" value={formData.user || ""} onChange={handleAdminChange}>
                  <option value="" disabled>
                    Select An Admin
                  </option>
                  {users &&
                    users
                      .filter((u) => u.isAdmin)
                      .map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.username}
                        </option>
                      ))}
                </select>
              </div>
            </div>

            <div className={styles.inputContainer}>
              <label className={styles.label}>sale Representative:</label>
              <input
                type="text"
                className={styles.input}
                value={formData.saleName}
                onChange={(e) => handleInputChange("saleName", e.target.value)}
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
              <label className={styles.label}>Project Name:</label>
              <input
                className={styles.input}
                value={formData.projectName}
                onChange={(e) => handleInputChange("projectName", e.target.value)}
                readOnly
              />
            </div>

            <div className={styles.inputContainer}>
              <label className={styles.label}>Project Location Address:</label>
              <input
                className={styles.input}
                value={formData.projectLA}
                onChange={(e) => handleInputChange("projectLA", e.target.value)}
                readOnly
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
                  <td>Unit Price</td>
                  <td>Total Price</td>
                  <td></td>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <React.Fragment key={row.id}>
                    {/* Read-only section title row */}
                    {showTitles[index] && (
                      <tr className={`${styles.row} ${styles.titleRow}`}>
                        <td colSpan={7} className={styles.titleRowCell}>
                          <input
                            type="text"
                            className={styles.titleInput}
                            value={row.titleAbove}
                            readOnly
                          />
                        </td>
                      </tr>
                    )}

                    <tr className={styles.row}>
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
                          placeholder={row.productCode}
                          value={row.productCode}
                          onChange={(e) =>
                            handleRowInputChange(index, "productCode", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <textarea
                          className={`${styles.input1} ${styles.textarea}`}
                          placeholder={row.description}
                          value={row.description}
                          onChange={(e) =>
                            handleRowInputChange(index, "description", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          className={styles.input1}
                          placeholder={row.qty}
                          value={row.qty}
                          onChange={(e) =>
                            handleRowInputChange(index, "qty", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          className={styles.input1}
                          placeholder={row.unit}
                          value={row.unit}
                          onChange={(e) =>
                            handleRowInputChange(index, "unit", e.target.value)
                          }
                        />
                      </td>
                      <td>{(Number(row.unitPrice) || 0).toFixed(2)}</td>
                      <td>
                        {index === rows.length - 1 ? (
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
                            onClick={() => deleteRow(index)}
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
          </div>
        </div>

        <div className={styles.container}>
          <div className={styles.form5}>
            <p>Total Unit Price (Excluding VAT): {totals.totalUnitPrice}</p>
            <p>VAT ({selectedCurrency === "USD" ? "0%" : "15%"}): {totals.vatAmount}</p>
            <p>Total Unit Price (Including VAT): {totals.totalUnitPriceWithVAT}</p>
          </div>
        </div>

        <div className={styles.container}>
          <div className={styles.form1}>
            <div className={styles.inputContainer}>
              <label className={styles.label}>Payment Term:</label>
              <textarea
                className={styles.input}
                placeholder="paymentTerm"
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
            <button type="submit">Submit</button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SingleApprovePage;
