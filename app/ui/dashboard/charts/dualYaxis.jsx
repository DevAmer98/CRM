import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import styles from './chart.module.css'


const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatLabel = (dateKey) => {
  const date = new Date(`${dateKey}T00:00:00`);
  return date.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
};

const DualYAxisBarChart = () => {
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTrend = async () => {
      setLoading(true);
      setError("");
      try {
        const today = new Date();
        const fromDate = new Date();
        fromDate.setDate(today.getDate() - 13);
        const from = formatDateKey(fromDate);
        const to = formatDateKey(today);

        const response = await fetch(`/api/overview/quote-po-trend?from=${from}&to=${to}`, { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.message || "Failed to load activity.");
        }

        setTrend(Array.isArray(payload.trend) ? payload.trend : []);
      } catch (err) {
        setError(err?.message || "Failed to load activity.");
      } finally {
        setLoading(false);
      }
    };

    fetchTrend();
  }, []);

  const data = useMemo(
    () =>
      trend.map(item => ({
        date: item.date,
        label: formatLabel(item.date),
        quotations: item.quotations || 0,
        purchaseOrders: item.purchaseOrders || 0
      })),
    [trend]
  );

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Daily Activity</h2>
      {loading && <p className={styles.subtitle}>Loading quotations and purchase orders…</p>}
      {error && <p className={styles.subtitle}>{error}</p>}
      {!loading && !error && (
        <div className={styles.legendRow}>
          <div className={styles.legendItem}>
            <span className={`${styles.legendSwatch} ${styles.legendQuote}`}></span>
            <span>Quotations</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendSwatch} ${styles.legendPO}`}></span>
            <span>Purchase Orders</span>
          </div>
        </div>
      )}
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={data}
          margin={{ top: 8, right: 20, left: 4, bottom: 8 }}
          barGap={6}
          barCategoryGap="20%"
        >
          <defs>
            <linearGradient id="barQuote" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C9BFF" />
              <stop offset="100%" stopColor="#4A67F5" />
            </linearGradient>
            <linearGradient id="barPO" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7BFFB3" />
              <stop offset="100%" stopColor="#35C98E" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.08)" />
          <XAxis dataKey="label" tick={{ fill: "var(--textSoft)", fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fill: "var(--textSoft)", fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              background: "rgba(18, 24, 40, 0.95)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "12px",
              color: "#fff"
            }}
            labelStyle={{ color: "#9fb3c8" }}
          />
          <Bar name="Quotations" dataKey="quotations" fill="url(#barQuote)" radius={[6, 6, 0, 0]} />
          <Bar name="Purchase Orders" dataKey="purchaseOrders" fill="url(#barPO)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DualYAxisBarChart;
