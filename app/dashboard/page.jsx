'use client'
import React, { useState, useEffect } from 'react';
import styles from '../ui/hr_dashboard/hr_dashboard.module.css';
import { Suspense } from 'react';
import ErrorBoundary from '../ui/dashboard/errorBoundary/errorBoundary';
import Main from '../ui/dashboard/main/main';
import AccountantDashboard from '../ui/dashboard/accountant/AccountantDashboard';
import Navbar from '../ui/dashboard/navbar/navbar';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const Dashboard = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [allowed, setAllowed] = useState(true);

  useEffect(() => {
    if (status !== 'authenticated') return;
    const role = (session?.user?.role || '').toLowerCase();
    const allowed = ['admin', 'superadmin', 'super_admin', 'accountantadmin'];
    if (!allowed.includes(role)) {
      setAllowed(false);
      router.replace('/dashboard/private');
    } else {
      setAllowed(true);
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'authenticated' && !allowed) {
    return null;
  }

  const role = (session?.user?.role || '').toLowerCase();
  const showAccountant = role === 'accountantadmin';

  return (
    <ErrorBoundary>
    <Suspense fallback={<div>Loading...</div>}>
      <div className={styles.wrapper}>
        <div className={styles.main}>
        </div>
        {showAccountant ? <AccountantDashboard /> : <Main />}
       {/* <div className={styles.side}>
          <Rightbar />
        </div>*/}
      </div>
    </Suspense>
  </ErrorBoundary>
  );
};

export default Dashboard;
