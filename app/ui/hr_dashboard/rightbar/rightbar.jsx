import React, { useEffect, useState } from 'react';
import styles from "./rightbar.module.css";
import { MdWarning, MdAccessTime } from "react-icons/md";

const Rightbar = () => { 
    const [employees, setEmployees] = useState([]);

 useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch('/api/allEmployees');
        const data = await res.json();
        setEmployees(data);
      } catch (err) {
        console.error('Error fetching employees:', err);
      }
    };

    fetchEmployees();
  }, []);

  
  const getDaysUntilContractEnds = (endDate) => {
    if (!endDate) return '-';
    const today = new Date();
    const contractEnd = new Date(endDate);
    const diffTime = contractEnd - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Contract Timeline</h2>
      </div>
      <div className={styles.cardContainer}>
        {employees.map((employee) => {
          const daysLeft = getDaysUntilContractEnds(employee.contractEndDate);
          const isUrgent = daysLeft !== '-' && daysLeft <= 30;

          return (
            <div key={employee._id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.employeeInfo}>
                  <h3>{employee.name}</h3>
                  <span className={styles.role}>{employee.jobTitle}</span>
                </div>
              </div>

              <div className={styles.contractInfo}>
                <div className={styles.timeDisplay}>
                  <MdAccessTime className={styles.icon} />
                  <span>Days Remaining:</span>
                </div>
                <div className={`${styles.daysCounter} ${isUrgent ? styles.urgent : ''}`}>
                  {daysLeft !== '-' ? `${daysLeft} days` : 'N/A'}
                </div>
              </div>

              {isUrgent && (
                <div className={styles.warningBanner}>
                  <MdWarning />
                  <span>Contract renewal needed</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Rightbar;
