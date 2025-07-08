'use client'
import React, { useState, useEffect } from 'react';
import styles from '../../ui/hr_dashboard/hr_dashboard.module.css';
import { Suspense } from 'react';
import ErrorBoundary from '../../ui/dashboard/errorBoundary/errorBoundary';
import AdminPage from '@/app/ui/private_dashbaord/hr_admin';
import HR_AdminPage from '@/app/ui/private_dashbaord/hr_admin';

const PrivateDahbaord = () => {
 
  

  return (
    <ErrorBoundary>
    <Suspense fallback={<div>Loading...</div>}>
      <div className={styles.wrapper}>
        <div className={styles.main}>
        <HR_AdminPage />
        </div>
      </div>
    </Suspense>
  </ErrorBoundary>
  );
};

export default PrivateDahbaord;
