'use client'
import React, { useState, useEffect } from 'react';
import styles from '../../ui/hr_dashboard/hr_dashboard.module.css';
import { Suspense } from 'react';
import ErrorBoundary from '../../ui/dashboard/errorBoundary/errorBoundary';
import AdminPage from '@/app/ui/private_dashbaord/admin';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const PrivateDahbaord = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== 'authenticated') return;
    // Private dashboard is allowed for all authenticated roles
  }, [status]);

  return (
    <ErrorBoundary>
    <Suspense fallback={<div>Loading...</div>}>
      <div className={styles.wrapper}>
        <div className={styles.main}>
        <AdminPage />
        </div>
      </div>
    </Suspense>
  </ErrorBoundary>
  );
};

export default PrivateDahbaord;
