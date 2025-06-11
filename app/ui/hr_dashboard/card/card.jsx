import React from 'react';
import { TrendingUp, Users, Briefcase, Package } from 'lucide-react';
import styles from './card.module.css';

const Card = ({ title, number, detailText }) => {
  // Function to get the appropriate icon based on title
  const getIcon = (title) => {
    switch (title) {
      case "Total Employees" && "Total Clients":
        return <Users className={styles.icon} />;
      case "Total Managers":
        return <Briefcase className={styles.icon} />;
      case "Total Suppliers":
        return <Package className={styles.icon} />;
      default:
        return <TrendingUp className={styles.icon} />;
    }
  };

  // Function to get the appropriate color class based on title
  const getColorClass = (title) => {
    switch (title) {
      case "Total Employees" && "Total Users":
        return styles.blue;
      case "Total Managers":
        return styles.purple;
      case "Total Suppliers":
        return styles.orange;
      default:
        return styles.green;
    }
  };

  return (
    <div className={`${styles.card} ${getColorClass(title)}`}>
      <div className={styles.iconWrapper}>
        {getIcon(title)}
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.numberContainer}>
          <span className={styles.number}>{number}</span>
          <div className={styles.sparkline}>
            <div className={styles.sparkbar}></div>
            <div className={styles.sparkbar}></div>
            <div className={styles.sparkbar}></div>
            <div className={styles.sparkbar}></div>
          </div>
        </div>
        <p className={styles.detail}>{detailText}</p>
      </div>
    </div>
  );
};

export default Card;