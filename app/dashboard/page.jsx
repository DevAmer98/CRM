'use client'
import React, { useState, useEffect } from 'react';
import styles from '../ui/hr_dashboard/hr_dashboard.module.css';
import { Suspense } from 'react';
import ErrorBoundary from '../ui/dashboard/errorBoundary/errorBoundary';
import Main from '../ui/dashboard/main/main';
import Navbar from '../ui/dashboard/navbar/navbar';

const Dashboard = () => {
 
  

  return (
    <ErrorBoundary>
    <Suspense fallback={<div>Loading...</div>}>
      <div className={styles.wrapper}>
        <div className={styles.main}>
        </div>
        <Main />
       {/* <div className={styles.side}>
          <Rightbar />
        </div>*/}
      </div>
    </Suspense>
  </ErrorBoundary>
  );
};

export default Dashboard;
