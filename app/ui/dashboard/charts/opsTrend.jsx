import React, { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import styles from "./chart.module.css";

const formatLabel = (monthKey) => {
  const [year, month] = String(monthKey || "").split("-");
  if (!year || !month) return monthKey;
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString(undefined, { month: "short" });
};

const OpsTrend = ({ data }) => {
  const chartData = useMemo(
    () =>
      (Array.isArray(data) ? data : []).map(item => ({
        month: item.month,
        label: formatLabel(item.month),
        leads: item.leads || 0,
        jobOrders: item.jobOrders || 0
      })),
    [data]
  );

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <div>
          <h3 className={styles.chartTitle}>Lead & Job Order Momentum</h3>
          <p className={styles.chartSubtitle}>Last 6 months, new records</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={chartData} margin={{ top: 8, right: 20, left: 4, bottom: 8 }}>
          <defs>
            <linearGradient id="leadFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C9BFF" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#7C9BFF" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="jobFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7BFFB3" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#7BFFB3" stopOpacity={0} />
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
          <Area type="monotone" dataKey="leads" stroke="#7C9BFF" fill="url(#leadFill)" strokeWidth={2} />
          <Area type="monotone" dataKey="jobOrders" stroke="#7BFFB3" fill="url(#jobFill)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OpsTrend;
