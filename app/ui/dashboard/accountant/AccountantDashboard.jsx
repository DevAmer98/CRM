"use client";
import React from "react";
import styles from "../main/main.module.css";
import DashedLineChart from "../charts/stnadart";
import DualYAxisBarChart from "../charts/dualYaxis";
import CustomPieChart from "../charts/customChart";
import TinyBarChart from "../charts/bar";
import ColorfullPieChart from "../charts/colorfull";

const AccountantDashboard = () => {
  const kpis = [
    { label: "Sales pre-invoices ready", value: "38" },
    { label: "Purchase pre-invoices ready", value: "19" },
    { label: "Pending client matches", value: "14" },
    { label: "Pending supplier matches", value: "9" },
  ];

  const statusMix = [
    { label: "Ready", value: "57" },
    { label: "Needs match", value: "10" },
    { label: "Awaiting approval", value: "19" },
    { label: "Rejected", value: "3" },
  ];

  const pipelineCards = [
    { title: "Sales invoices", value: "SAR 1.84M", change: "+8.2%" },
    { title: "Purchase invoices", value: "SAR 1.12M", change: "+4.6%" },
    { title: "Overdue items", value: "SAR 182K", change: "-2.1%" },
    { title: "Cash in", value: "SAR 960K", change: "+12.4%" },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.accountantHeader}>
        <h1 className={styles.accountantTitle}>Accountant Dashboard</h1>
        <p className={styles.accountantSubtitle}>
          Finance overview focused on Medad pre-invoices, approvals, and matching.
        </p>
      </div>

      <div className={styles.accountantKpiRow}>
        {pipelineCards.map((item) => (
          <div key={item.title} className={`${styles.statCard} ${styles.accountantKpiCard}`}>
            <div className={styles.statCardContent}>
              <div className={styles.statCardText}>
                <span className={styles.accountantKpiLabel}>{item.title}</span>
                <span className={styles.accountantKpiValue}>{item.value}</span>
                <span className={styles.statCardChangePositive}>{item.change}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.accountantKpiRow}>
        {kpis.map((item) => (
          <div key={item.label} className={`${styles.statCard} ${styles.accountantKpiCard}`}>
            <div className={styles.statCardContent}>
              <div className={styles.statCardText}>
                <span className={styles.accountantKpiLabel}>{item.label}</span>
                <span className={styles.accountantKpiValue}>{item.value}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.cardGrid}>
        <div className={`${styles.card} ${styles.accountantChartCard}`}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Quotation vs Purchase Order flow</h2>
            <span className={styles.cardIcon}>📈</span>
          </div>
          <DashedLineChart />
        </div>
      </div>

      <div className={styles.taskGrid}>
        <div className={`${styles.card} ${styles.accountantChartCard}`}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Daily finance activity</h2>
            <span className={styles.cardIcon}>📊</span>
          </div>
          <DualYAxisBarChart />
        </div>

        <div className={`${styles.card} ${styles.accountantChartCard}`}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Pre-invoice status mix</h2>
            <span className={styles.cardIcon}>🧾</span>
          </div>
          <ColorfullPieChart
            data={[
              { role: "Ready", count: 57 },
              { role: "Needs Match", count: 10 },
              { role: "Awaiting Approval", count: 19 },
              { role: "Rejected", count: 3 },
            ]}
          />
          <div className={styles.statusLegend}>
            {statusMix.map((item) => (
              <div key={item.label} className={styles.statusLegendItem}>
                <div className={styles.statusLegendLabel}>
                  <div className={styles.legendDot}></div>
                  <span className={styles.statusLegendText}>{item.label}</span>
                </div>
                <span className={styles.statusLegendValue}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`${styles.card} ${styles.accountantChartCard}`}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Weekly cash movement</h2>
            <span className={styles.cardIcon}>💳</span>
          </div>
          <TinyBarChart />
          <div className={styles.controlsRow}>
            <button className={styles.refreshButton} type="button">
              Review payments
            </button>
            <button className={styles.refreshButton} type="button">
              Export report
            </button>
          </div>
        </div>

        <div className={`${styles.card} ${styles.accountantChartCard}`}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Match quality</h2>
            <span className={styles.cardIcon}>✅</span>
          </div>
          <div className={styles.taskList}>
            <div className={styles.taskItem}>
              <div className={styles.taskContent}>
                <div className={styles.taskDetails}>
                  <p className={`${styles.taskTitle} ${styles.taskTitleActive}`}>
                    Clients matched
                  </p>
                  <p className={styles.taskStatus}>412 of 426</p>
                </div>
              </div>
              <span className={`${styles.priorityBadge} ${styles.priorityLow}`}>96.7%</span>
            </div>
            <div className={styles.taskItem}>
              <div className={styles.taskContent}>
                <div className={styles.taskDetails}>
                  <p className={`${styles.taskTitle} ${styles.taskTitleActive}`}>
                    Suppliers matched
                  </p>
                  <p className={styles.taskStatus}>228 of 237</p>
                </div>
              </div>
              <span className={`${styles.priorityBadge} ${styles.priorityLow}`}>96.2%</span>
            </div>
            <div className={styles.taskItem}>
              <div className={styles.taskContent}>
                <div className={styles.taskDetails}>
                  <p className={`${styles.taskTitle} ${styles.taskTitleActive}`}>
                    Missing tax IDs
                  </p>
                  <p className={styles.taskStatus}>23 records</p>
                </div>
              </div>
              <span className={`${styles.priorityBadge} ${styles.priorityHigh}`}>Action</span>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};

export default AccountantDashboard;
