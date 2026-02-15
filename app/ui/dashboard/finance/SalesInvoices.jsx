import React from "react";
import Link from "next/link";
import Search from "@/app/ui/dashboard/search/search";
import Pagination from "@/app/ui/dashboard/pagination/pagination";
import styles from "./invoices.module.css";

const formatAmount = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return "—";
  return num.toFixed(2);
};

const getStatusClass = (status) => {
  if (status === "paid") return styles.statusPaid;
  if (status === "partial") return styles.statusPartial;
  return styles.statusUnpaid;
};

const SalesInvoices = ({ quotations, count }) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Sales Invoices</h1>
          <p className={styles.subtitle}>Quotations prepared as sales pre‑invoices.</p>
        </div>
      </div>

      <div className={styles.topBar}>
        <Search placeholder="Search by client..." />
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Quotation</th>
            <th>Client</th>
            <th>Project</th>
            <th>Total</th>
            <th>Currency</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {(quotations || []).map((q) => (
            <tr key={q._id}>
              <td>{q.quotationId || "—"}</td>
              <td>{q.client?.name || "—"}</td>
              <td>{q.projectName || "—"}</td>
              <td>{formatAmount(q.totalPrice)}</td>
              <td>{q.currency || "—"}</td>
              <td>
                <span className={`${styles.statusBadge} ${getStatusClass(q.paymentStatus)}`}>
                  {q.paymentStatus || "unpaid"}
                </span>
              </td>
              <td>{q.createdAt ? new Date(q.createdAt).toLocaleDateString() : "—"}</td>
              <td>
                <div className={styles.actions}>
                  <Link className={styles.viewButton} href={`/dashboard/quotations/${q._id}`}>
                    View
                  </Link>
                  <button className={styles.medadButton} type="button" disabled>
                    Send to Medad
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination count={count} />
    </div>
  );
};

export default SalesInvoices;
