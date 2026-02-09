import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import styles from "./chart.module.css";

const TopRankBar = ({ title, subtitle, data, valueKey = "count" }) => {
  const chartData = useMemo(
    () =>
      (Array.isArray(data) ? data : []).map(item => ({
        name: item.name || "Unknown",
        count: item.count || 0,
        total: item.total || 0
      })),
    [data]
  );

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <div>
          <h3 className={styles.chartTitle}>{title}</h3>
          {subtitle && <p className={styles.chartSubtitle}>{subtitle}</p>}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <defs>
            <linearGradient id="rankBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C9BFF" />
              <stop offset="100%" stopColor="#4A67F5" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.08)" />
          <XAxis
            dataKey="name"
            tick={{ fill: "var(--textSoft)", fontSize: 12 }}
            interval={0}
            angle={-15}
            textAnchor="end"
            height={50}
          />
          <YAxis allowDecimals={false} tick={{ fill: "var(--textSoft)", fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              background: "rgba(18, 24, 40, 0.95)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "12px",
              color: "#fff"
            }}
            labelStyle={{ color: "#9fb3c8" }}
            formatter={(value, name, props) => {
              if (name === "count") return [value, "Orders"];
              return [value, name];
            }}
          />
          <Bar dataKey={valueKey} fill="url(#rankBar)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TopRankBar;
