"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import styles from "./chart.module.css";

const COLORS = ['#4e73df', '#1cc88a', '#f6c23e', '#e74a3b', '#36b9cc', '#6610f2', '#fd7e14'];
const ColorfullPieChart = ({ data = [], colorMap = {} }) => {
  const chartData = data.map(item => ({
    name: formatRoleName(item.role),
  role: item.role, // preserve raw key
  value: item.count,  }));

  return (
    <div className={styles.pieWrapper}>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            outerRadius={100}
            label
          >
            {chartData.map((entry, index) => (
              <Cell
    key={`cell-${index}`}
    fill={colorMap[entry.role] || COLORS[index % COLORS.length]}
  />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// Optional helper to format role keys like "userPro" -> "User Pro"
const formatRoleName = (role) => {
  return role
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, str => str.toUpperCase());
};

export default ColorfullPieChart;
