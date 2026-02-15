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

const PurchaseInvoices = ({ purchaseOrders, count }) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Purchase Invoices</h1>
          <p className={styles.subtitle}>Purchase orders prepared as purchase pre‑invoices.</p>
        </div>
      </div>

      <div className={styles.topBar}>
        <Search placeholder="Search by supplier..." />
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Purchase Order</th>
            <th>Supplier</th>
            <th>Job Order</th>
            <th>Total</th>
            <th>Currency</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {(purchaseOrders || []).map((po) => (
            <tr key={po._id}>
              <td>{po.purchaseId || "—"}</td>
              <td>{po.supplier?.name || "—"}</td>
              <td>{po.jobOrder?.jobOrderId || "—"}</td>
              <td>{formatAmount(po.totalPrice)}</td>
              <td>{po.currency || "—"}</td>
              <td>
                <span className={`${styles.statusBadge} ${getStatusClass(po.paymentStatus)}`}>
                  {po.paymentStatus || "unpaid"}
                </span>
              </td>
              <td>{po.createdAt ? new Date(po.createdAt).toLocaleDateString() : "—"}</td>
              <td>
                <div className={styles.actions}>
                  <Link className={styles.viewButton} href={`/dashboard/purchaseOrder/${po._id}`}>
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

export default PurchaseInvoices;
