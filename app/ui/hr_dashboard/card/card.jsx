import React from 'react';
import { TrendingUp, Users, Briefcase, Package, DollarSign, IdCardLanyard, FileLock, FileClock, TicketCheck, FileBox } from 'lucide-react';
import styles from './card.module.css';

const Card = ({ title, number, detailText }) => {
  // Function to get the appropriate icon based on title
  const getIcon = (title) => {
    switch (title) {
      case "Total Clients":
        return <Users className={styles.icon} />;
      case "Total Managers":
        return <Briefcase className={styles.icon} />;
      case "Total Suppliers":
        return <Package className={styles.icon} />;
         case "Total Revenue":
        return <DollarSign className={styles.icon} />;
         case "Total Employees":
        return <IdCardLanyard className={styles.icon} />;
         case "Total Quotations":
        return <FileClock className={styles.icon} />;
         case "Total Leads":
        return <IdCardLanyard className={styles.icon} />;
         case "Total Purchase Orders":
        return <FileBox className={styles.icon} />;
      default:
        return <TrendingUp className={styles.icon} />;
    }
  };

  // Function to get the appropriate color class based on title
  const getColorClass = (title) => {
    switch (title) {
      case "Total Users":
        return styles.blue;
      case "Total Managers":
        return styles.purple;
      case "Total Suppliers":
        return styles.orange;
         case "Total Revenue":
        return styles.yellow;
          case "Total Quotations":
        return styles.WillowGrove;
         case "Total Leads":
        return styles.red;
         case "Total Purchase Orders":
        return styles.Turquoise;
         case "Total Employees":
        return styles.red;
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