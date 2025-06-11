import React, { useState, useEffect } from 'react';
import styles from './EmployeePassportSlideshow.module.css'; // Import the CSS file

const PassportExpirationSlideshow = () => {
  // Sample employee data - replace with your actual data source
  const [employees, setEmployees] = useState([
    { id: 1, name: "Emma Johnson", passportNumber: "AB1234567", expiryDate: "2025-06-15",  nationality: "USA" },
    { id: 2, name: "Liam Smith", passportNumber: "CD7654321", expiryDate: "2025-03-10",  nationality: "Canada" },
    { id: 3, name: "Olivia Brown", passportNumber: "EF8765432", expiryDate: "2024-12-20",  nationality: "UK" },
    { id: 4, name: "Noah Davis", passportNumber: "GH2345678", expiryDate: "2024-07-05",  nationality: "Australia" },
    { id: 5, name: "Ava Wilson", passportNumber: "IJ3456789", expiryDate: "2026-01-30",  nationality: "France" },
    { id: 6, name: "Benjamin Moore", passportNumber: "KL4567890", expiryDate: "2025-09-22",  nationality: "Germany" },
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [visibleCardsCount, setVisibleCardsCount] = useState(4);

  // Calculate days until expiration
  const calculateDaysUntilExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get status and color based on days until expiration
  const getExpiryStatus = (daysUntil) => {
    if (daysUntil < 0) {
      return { status: "Expired", color: "statusExpired" };
    } else if (daysUntil < 90) {
      return { status: "Critical", color: "statusCritical" };
    } else if (daysUntil < 180) {
      return { status: "Warning", color: "statusWarning" };
    } else {
      return { status: "Valid", color: "statusValid" };
    }
  };

  // Sort employees by expiration date (soonest first)
  useEffect(() => {
    const sortedEmployees = [...employees].sort((a, b) => {
      return new Date(a.expiryDate) - new Date(b.expiryDate);
    });
    setEmployees(sortedEmployees);
  }, []);

  // Handle window resize to adjust visible cards count
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setVisibleCardsCount(1);
      } else if (window.innerWidth < 768) {
        setVisibleCardsCount(2);
      } else if (window.innerWidth < 1024) {
        setVisibleCardsCount(3);
      } else {
        setVisibleCardsCount(4);
      }
    };
    
    // Set initial count
    handleResize();
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-scroll functionality
  useEffect(() => {
    let interval;
    if (isAutoPlay) {
      interval = setInterval(() => {
        setCurrentIndex((prevIndex) => 
          prevIndex >= employees.length - visibleCardsCount ? 0 : prevIndex + 1
        );
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isAutoPlay, employees.length, visibleCardsCount]);

  // Navigation functions
  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? employees.length - visibleCardsCount : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex >= employees.length - visibleCardsCount ? 0 : prevIndex + 1
    );
  };

  const toggleAutoPlay = () => {
    setIsAutoPlay(!isAutoPlay);
  };


  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Employee Passport Expirations</h2>
      
      {/* Controls */}
      <div className={styles.controls}>
        <button onClick={goToPrevious} className={styles.controlButton}>
          Previous
        </button>
        <button onClick={toggleAutoPlay} className={`${styles.controlButton} ${styles.playPauseButton}`}>
          {isAutoPlay ? "Pause" : "Play"}
        </button>
        <button onClick={goToNext} className={styles.controlButton}>
          Next
        </button>
      </div>
      
      {/* Slideshow container */}
      <div className={styles.slideshow}>
        <div 
          className={styles.inner} 
          style={{ transform: `translateX(-${currentIndex * (100 / visibleCardsCount)}%)` }}
        >
          {employees.map((employee) => {
            const daysUntilExpiry = calculateDaysUntilExpiry(employee.expiryDate);
            const { status, color } = getExpiryStatus(daysUntilExpiry);
            
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
                        {daysUntilExpiry < 0 
                          ? `Expired ${Math.abs(daysUntilExpiry)}d ago` 
                          : `${daysUntilExpiry}d left`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
     
    </div>
  );
};

export default PassportExpirationSlideshow;