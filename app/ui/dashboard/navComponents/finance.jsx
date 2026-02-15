"use client";
import React from "react";
import styles from "../main/main.module.css";

const Finance = () => {
  const matchingStats = [
    { label: "Clients matched", value: "412" },
    { label: "Suppliers matched", value: "228" },
    { label: "Clients pending", value: "14" },
    { label: "Suppliers pending", value: "9" },
  ];

  const queues = [
    {
      type: "Sales pre-invoice",
      source: "Quotation #Q-24118",
      counterparty: "Arabian Line",
      amount: "SAR 12,480.00",
      status: "Ready",
    },
    {
      type: "Purchase pre-invoice",
      source: "PO #PO-5507",
      counterparty: "Delta Supplies",
      amount: "SAR 6,300.00",
      status: "Needs match",
    },
    {
      type: "Sales pre-invoice",
      source: "Quotation #Q-24125",
      counterparty: "Jeddah Vision",
      amount: "SAR 18,000.00",
      status: "Ready",
    },
    {
      type: "Purchase pre-invoice",
      source: "PO #PO-5521",
      counterparty: "Al Noor Trading",
      amount: "SAR 3,750.00",
      status: "Queued",
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>Finance</h1>
        <p className={styles.headerSubtitle}>
          Pre-invoice workflow for Medad approvals from quotations and purchase orders.
        </p>
      </div>

      <div className={styles.wrapper}>
        <div className={styles.main}>
          <div className={styles.cards}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Matching status</h2>
                <span className={styles.cardIcon}>🔗</span>
              </div>
              <div className={styles.statusSummaryGrid}>
                {matchingStats.map((stat) => (
                  <div key={stat.label} className={styles.statusSummaryItem}>
                    <strong>{stat.value}</strong>
                    <small>{stat.label}</small>
                  </div>
                ))}
              </div>
              <div className={styles.controlsRow}>
                <button className={styles.refreshButton} type="button">
                  Sync matches
                </button>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Sales pre-invoices</h2>
                <span className={styles.cardIcon}>💼</span>
              </div>
              <div className={styles.statusSummaryGrid}>
                <div className={styles.statusSummaryItem}>
                  <strong>38</strong>
                  <small>Ready to upload</small>
                </div>
                <div className={styles.statusSummaryItem}>
                  <strong>6</strong>
                  <small>Needs matching</small>
                </div>
                <div className={styles.statusSummaryItem}>
                  <strong>12</strong>
                  <small>Awaiting approval</small>
                </div>
              </div>
              <div className={styles.controlsRow}>
                <button className={styles.refreshButton} type="button">
                  Review quotations
                </button>
                <button className={styles.refreshButton} type="button">
                  Prepare sales upload
                </button>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Purchase pre-invoices</h2>
                <span className={styles.cardIcon}>📦</span>
              </div>
              <div className={styles.statusSummaryGrid}>
                <div className={styles.statusSummaryItem}>
                  <strong>19</strong>
                  <small>Ready to upload</small>
                </div>
                <div className={styles.statusSummaryItem}>
                  <strong>4</strong>
                  <small>Needs matching</small>
                </div>
                <div className={styles.statusSummaryItem}>
                  <strong>7</strong>
                  <small>Awaiting approval</small>
                </div>
              </div>
              <div className={styles.controlsRow}>
                <button className={styles.refreshButton} type="button">
                  Review purchase orders
                </button>
                <button className={styles.refreshButton} type="button">
                  Prepare purchase upload
                </button>
              </div>
            </div>
          </div>

          <div className={styles.mainGrid}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Pre-invoice queue</h2>
                <span className={styles.cardIcon}>🧾</span>
              </div>
              <div className={styles.taskList}>
                {queues.map((item) => {
                  let badgeClass = styles.priorityMedium;
                  if (item.status === "Ready") badgeClass = styles.priorityLow;
                  if (item.status === "Needs match") badgeClass = styles.priorityHigh;
                  return (
                    <div key={`${item.type}-${item.source}`} className={styles.taskItem}>
                      <div className={styles.taskContent}>
                        <div className={styles.taskDetails}>
                          <p className={`${styles.taskTitle} ${styles.taskTitleActive}`}>
                            {item.type}
                          </p>
                          <p className={styles.taskStatus}>
                            {item.source} • {item.counterparty}
                          </p>
                        </div>
                      </div>
                      <span className={`${styles.priorityBadge} ${badgeClass}`}>
                        {item.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Rules and checks</h2>
                <span className={styles.cardIcon}>✅</span>
              </div>
              <div className={styles.taskList}>
                <div className={styles.taskItem}>
                  <div className={styles.taskContent}>
                    <div className={styles.taskDetails}>
                      <p className={`${styles.taskTitle} ${styles.taskTitleActive}`}>
                        Approved quotation with client match required
                      </p>
                      <p className={styles.taskStatus}>Sales pre-invoices</p>
                    </div>
                  </div>
                </div>
                <div className={styles.taskItem}>
                  <div className={styles.taskContent}>
                    <div className={styles.taskDetails}>
                      <p className={`${styles.taskTitle} ${styles.taskTitleActive}`}>
                        Approved purchase order with supplier match required
                      </p>
                      <p className={styles.taskStatus}>Purchase pre-invoices</p>
                    </div>
                  </div>
                </div>
                <div className={styles.taskItem}>
                  <div className={styles.taskContent}>
                    <div className={styles.taskDetails}>
                      <p className={`${styles.taskTitle} ${styles.taskTitleActive}`}>
                        Medad approves pre-invoices only
                      </p>
                      <p className={styles.taskStatus}>Final posting after approval</p>
                    </div>
                  </div>
                </div>
                <div className={styles.taskItem}>
                  <div className={styles.taskContent}>
                    <div className={styles.taskDetails}>
                      <p className={`${styles.taskTitle} ${styles.taskTitleActive}`}>
                        Missing tax data blocks upload
                      </p>
                      <p className={styles.taskStatus}>Resolve client or supplier data</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.controlsRow}>
                <button className={styles.refreshButton} type="button">
                  Validate requirements
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Finance;
