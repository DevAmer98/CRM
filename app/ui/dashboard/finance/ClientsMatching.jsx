"use client";
import React from "react";
import styles from "../main/main.module.css";

const ClientsMatching = () => {
  const stats = [
    { label: "Matched clients", value: "412" },
    { label: "Pending review", value: "14" },
    { label: "Missing tax ID", value: "9" },
    { label: "Duplicate records", value: "3" },
  ];

  const rows = [
    { name: "Arabian Line", status: "Matched", medadId: "MD-2039", notes: "Tax ID verified" },
    { name: "Jeddah Vision", status: "Pending", medadId: "—", notes: "Awaiting tax ID" },
    { name: "Smart Meter Co.", status: "Matched", medadId: "MD-1182", notes: "Address verified" },
    { name: "Delta Systems", status: "Review", medadId: "MD-2210", notes: "Possible duplicate" },
  ];

  const statusClass = (status) => {
    if (status === "Matched") return styles.priorityLow;
    if (status === "Pending") return styles.priorityMedium;
    return styles.priorityHigh;
  };

  return (
    <div className={styles.container}>
      <div className={styles.matchingHeader}>
        <h1 className={styles.matchingTitle}>Clients Matching</h1>
        <p className={styles.matchingSubtitle}>
          Match CRM clients to Medad accounts before pre‑invoice upload.
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

export default ClientsMatching;
