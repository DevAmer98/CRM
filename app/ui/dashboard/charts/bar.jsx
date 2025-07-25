import React from 'react';
import { BarChart, Bar, ResponsiveContainer, XAxis } from 'recharts';
import styles from './chart.module.css'

const data = [
  { name: 'Page A', uv: 4000, pv: 2400, amt: 2400 },
  { name: 'Page B', uv: 3000, pv: 1398, amt: 2210 },
  { name: 'Page C', uv: 2000, pv: 9800, amt: 2290 },
  { name: 'Page D', uv: 2780, pv: 3908, amt: 2000 },
  { name: 'Page E', uv: 1890, pv: 4800, amt: 2181 },
  { name: 'Page F', uv: 2390, pv: 3800, amt: 2500 },
  { name: 'Page G', uv: 3490, pv: 4300, amt: 2100 },
];

const TinyBarChart = () => {
  return (
    <div className={styles.container}>
        <h2 className={styles.title}>Weekly Recap</h2>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart width={150} height={80} data={data}>
          <XAxis dataKey="name" />
        <Bar dataKey="uv" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
        </div>

  );
};

export default TinyBarChart;
