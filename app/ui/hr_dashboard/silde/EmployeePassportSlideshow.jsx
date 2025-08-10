'use client';
import React, { useState, useEffect } from 'react';
import styles from './EmployeePassportSlideshow.module.css'; // Make sure the CSS file exists

const PassportExpirationSlideshow = () => {
  const [employees, setEmployees] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [visibleCardsCount, setVisibleCardsCount] = useState(4);
  const [loading, setLoading] = useState(true);

  // Fetch real employee data
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch('/api/allEmployees', { cache: 'no-store' });
        const data = await res.json();

        const filtered = data.filter(emp =>
          emp.passportExpirationDate && emp.name && emp.passportNo
        );

        const formatted = filtered.map(emp => ({
          id: emp._id,
          name: emp.name,
          passportNumber: emp.passportNo,
          expiryDate: emp.passportExpirationDate,
        }));

        formatted.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
        setEmployees(formatted);
      } catch (err) {
        console.error("Error fetching employees:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  // Handle resize for responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setVisibleCardsCount(1);
      else if (window.innerWidth < 768) setVisibleCardsCount(2);
      else if (window.innerWidth < 1024) setVisibleCardsCount(3);
      else setVisibleCardsCount(4);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-play functionality
  useEffect(() => {
    let interval;
    if (isAutoPlay) {
      interval = setInterval(() => {
        setCurrentIndex((prev) =>
          prev >= employees.length - visibleCardsCount ? 0 : prev + 1
        );
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isAutoPlay, employees.length, visibleCardsCount]);

  // Helper functions
  const calculateDaysUntilExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getExpiryStatus = (days) => {
    if (days < 0) return { status: "Expired", color: "statusExpired" };
    if (days < 90) return { status: "Critical", color: "statusCritical" };
    if (days < 180) return { status: "Warning", color: "statusWarning" };
    return { status: "Valid", color: "statusValid" };
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? employees.length - visibleCardsCount : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prev) =>
      prev >= employees.length - visibleCardsCount ? 0 : prev + 1
    );
  };

  const toggleAutoPlay = () => {
    setIsAutoPlay(!isAutoPlay);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Employee Passport Expirations</h2>

      <div className={styles.controls}>
        <button onClick={goToPrevious} className={styles.controlButton}>Previous</button>
        <button onClick={toggleAutoPlay} className={`${styles.controlButton} ${styles.playPauseButton}`}>
          {isAutoPlay ? "Pause" : "Play"}
        </button>
        <button onClick={goToNext} className={styles.controlButton}>Next</button>
      </div>

      {loading ? (
        <p>Loading employee passport data...</p>
      ) : (
        <div className={styles.slideshow}>
          <div 
            className={styles.inner}
            style={{ transform: `translateX(-${currentIndex * (100 / visibleCardsCount)}%)` }}
          >
            {employees.map(employee => {
              const daysLeft = calculateDaysUntilExpiry(employee.expiryDate);
              const { status, color } = getExpiryStatus(daysLeft);

              return (
                <div 
                  key={employee.id} 
                  className={styles.card}
                  style={{ width: `${100 / visibleCardsCount}%` }}
                >
                  <div className={styles.cardInner}>
                    <div className={styles.employeeDetails}>
                      <h3 className={styles.employeeName}>{employee.name}</h3>
                      <p className={styles.employeePassport}>#{employee.passportNumber}</p>
                      <div className={styles.employeeStatus}>
                        <span className={`${styles.statusDot} ${styles[color]}`}></span>
                        <span className={styles.statusText}>
                          {daysLeft < 0
                            ? `Expired ${Math.abs(daysLeft)}d ago`
                            : `${daysLeft}d left (${status})`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PassportExpirationSlideshow;
