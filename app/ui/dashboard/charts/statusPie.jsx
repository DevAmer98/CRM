import React, { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import styles from "./chart.module.css";

const COLORS = ["#7C9BFF", "#7BFFB3", "#F4C37A", "#FF7A7A"];

const formatLabel = (label) =>
  String(label || "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

const StatusPie = ({ title, subtitle, data }) => {
  const chartData = useMemo(
    () =>
      (Array.isArray(data) ? data : []).map((item, index) => ({
        name: formatLabel(item.name),
        value: item.value || 0,
        color: COLORS[index % COLORS.length]
      })),
    [data]
  );

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <div>
          <h3 className={styles.chartTitle}>{title}</h3>
          {subtitle && <p className={styles.chartSubtitle}>{subtitle}</p>}
        </div>
        <span className={styles.chartTotal}>{total}</span>
      </div>
      <div className={styles.pieWrap}>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              stroke="rgba(255,255,255,0.08)"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${entry.name}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "rgba(18, 24, 40, 0.95)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "12px",
                color: "#fff",
                boxShadow: "0 12px 24px rgba(0,0,0,0.35)"
              }}
              labelStyle={{ color: "#9fb3c8" }}
              itemStyle={{ color: "#ffffff" }}
              formatter={(value, name) => [value, name]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className={styles.pieLegend}>
        {chartData.map(item => (
          <div key={item.name} className={styles.pieLegendItem}>
            <span className={styles.pieDot} style={{ background: item.color }}></span>
            <span>{item.name}</span>
            <span className={styles.pieLegendValue}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatusPie;
