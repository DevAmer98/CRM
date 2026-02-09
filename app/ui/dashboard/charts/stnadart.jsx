import React, { useEffect, useMemo, useState } from 'react';
import {
  LineChart,
  Line,
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

const DashedLineChart = () => {
  const [trend, setTrend] = useState([]);
  const [summary, setSummary] = useState({ quotations: 0, purchaseOrders: 0 });
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
          throw new Error(payload?.message || "Failed to load quotation trend.");
        }

        const trendData = Array.isArray(payload.trend) ? payload.trend : [];
        setTrend(trendData);
        setSummary({
          quotations: trendData.reduce((sum, item) => sum + (item.quotations || 0), 0),
          purchaseOrders: trendData.reduce((sum, item) => sum + (item.purchaseOrders || 0), 0)
        });
      } catch (err) {
        setError(err?.message || "Failed to load quotation trend.");
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
      <div className={styles.titleRow}>
        <h2 className={styles.title}>Quotations vs Purchase Orders</h2>
        {!loading && !error && (
          <div className={styles.kicker}>
            <span>{summary.quotations} quotations</span>
            <span className={styles.kickerDot}></span>
            <span>{summary.purchaseOrders} purchase orders</span>
          </div>
        )}
      </div>
      {loading && <p className={styles.subtitle}>Loading activity…</p>}
      {error && <p className={styles.subtitle}>{error}</p>}

      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <defs>
            <linearGradient id="quoteStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7C9BFF" />
              <stop offset="100%" stopColor="#6CE7FF" />
            </linearGradient>
            <linearGradient id="poStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8BFFB5" />
              <stop offset="100%" stopColor="#F4C37A" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.08)" />
          <XAxis dataKey="label" />
          <YAxis allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: "rgba(18, 24, 40, 0.95)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "12px",
              color: "#fff"
            }}
            labelStyle={{ color: "#9fb3c8" }}
          />
          <Line
            type="monotone"
            dataKey="quotations"
            stroke="url(#quoteStroke)"
            strokeWidth={3}
            dot={{ r: 2, strokeWidth: 2, stroke: "#7C9BFF" }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="purchaseOrders"
            stroke="url(#poStroke)"
            strokeWidth={3}
            dot={{ r: 2, strokeWidth: 2, stroke: "#8BFFB5" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DashedLineChart;
