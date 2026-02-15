"use client";
import React from "react";
import styles from "../main/main.module.css";

const SuppliersMatching = () => {
  const stats = [
    { label: "Matched suppliers", value: "228" },
    { label: "Pending review", value: "9" },
    { label: "Missing tax ID", value: "6" },
    { label: "Duplicate records", value: "2" },
  ];

  const rows = [
    { name: "Al Noor Trading", status: "Matched", medadId: "MS-1044", notes: "Bank verified" },
    { name: "Delta Supplies", status: "Pending", medadId: "—", notes: "Awaiting tax ID" },
    { name: "Gulf Tech", status: "Matched", medadId: "MS-0871", notes: "Address verified" },
    { name: "Prime Works", status: "Review", medadId: "MS-1902", notes: "Possible duplicate" },
  ];

  const statusClass = (status) => {
    if (status === "Matched") return styles.priorityLow;
    if (status === "Pending") return styles.priorityMedium;
    return styles.priorityHigh;
  };

  return (
    <div className={styles.container}>
      <div className={styles.matchingHeader}>
        <h1 className={styles.matchingTitle}>Suppliers Matching</h1>
        <p className={styles.matchingSubtitle}>
          Match CRM suppliers to Medad accounts before purchase pre‑invoices.
        </p>
      </div>

      <div className={styles.matchingKpiRow}>
        {stats.map((item) => (
          <div key={item.label} className={`${styles.statCard} ${styles.matchingKpiCard}`}>
            <div className={styles.statCardContent}>
              <div className={styles.statCardText}>
                <span className={styles.statCardLabel}>{item.label}</span>
                <span className={styles.statCardValue}>{item.value}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={`${styles.card} ${styles.matchingListCard}`}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Latest matches</h2>
          <span className={styles.cardIcon}>🔎</span>
        </div>
        <div className={styles.taskList}>
          {rows.map((row) => (
            <div key={row.name} className={`${styles.taskItem} ${styles.matchingItem}`}>
              <div className={styles.taskContent}>
                <div className={styles.taskDetails}>
                  <p className={`${styles.taskTitle} ${styles.taskTitleActive}`}>{row.name}</p>
                  <p className={styles.taskStatus}>
                    Medad: {row.medadId} • {row.notes}
                  </p>
                </div>
              </div>
              <span className={`${styles.priorityBadge} ${styles.matchingBadge} ${statusClass(row.status)}`}>
                {row.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuppliersMatching;
