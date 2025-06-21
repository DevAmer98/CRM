import React from "react";
import styles from "./main.module.css"; // Make sure to include new styles here

const MetricCard = ({ variant = "blue", icon, title, value, detail }) => {
  return (
    <div className={`${styles.metricCard} ${styles[variant]}`}>
      <div className={styles.iconWrapper}>
        <span className={styles.icon}>{icon}</span>
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.numberContainer}>
          <div className={styles.number}>{value}</div>
          <div className={styles.sparkline}>
            <div className={styles.sparkbar}></div>
            <div className={styles.sparkbar}></div>
            <div className={styles.sparkbar}></div>
            <div className={styles.sparkbar}></div>
          </div>
        </div>
        <p className={styles.detail}>{detail}</p>
      </div>
    </div>
  );
};

export default MetricCard;
