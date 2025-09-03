'use client';

import styles from '../ui/hr_dashboard/hr_dashboard.module.css';
import Card from '../ui/hr_dashboard/card/card';
import Rightbar from '../ui/hr_dashboard/rightbar/rightbar';
import EmployeePassportSlideshow from '../ui/hr_dashboard/silde/EmployeePassportSlideshow';
import EmployeeIqamaSlideshow from '../ui/hr_dashboard/silde/EmployeeIqamaSlideshow';
import ErrorBoundary from '../ui/dashboard/errorBoundary/errorBoundary';
import { Suspense, useEffect, useState } from 'react';

export default function HrDashboard() {
  const [counts, setCounts] = useState({
    userCount: null,
    clientCount: null,
    supplierCount: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const domain =
      process.env.NEXT_PUBLIC_API_URL || window.location.origin;

    (async () => {
      try {
        const [userRes, clientRes, supplierRes] = await Promise.all([
          fetch(`${domain}/api/allUsersCount`, { cache: 'no-store' }),
          fetch(`${domain}/api/allClientsCount`, { cache: 'no-store' }),
          fetch(`${domain}/api/allSuppliersCount`, { cache: 'no-store' }),
        ]);

        if (!userRes.ok || !clientRes.ok || !supplierRes.ok) {
          throw new Error('Failed to fetch counts');
        }

        const [userData, clientData, supplierData] = await Promise.all([
          userRes.json(),
          clientRes.json(),
          supplierRes.json(),
        ]);

        setCounts({
          userCount: userData?.count ?? 0,
          clientCount: clientData?.count ?? 0,
          supplierCount: supplierData?.count ?? 0,
        });
      } catch (e) {
        setError(e?.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p>Loading data...</p>;
  if (error) return <p>Error fetching data: {error}</p>;

  return (
    <>
      {/* Fixed right sidebar (independent of layout) */}
      <Rightbar />

      <ErrorBoundary>
        <Suspense fallback={<div>Loading...</div>}>
          {/* Reserve space for the fixed rightbar ONLY on this page */}
          <div className={`${styles.wrapper} ${styles.withRightbar}`}>
            <div className={styles.main}>
              <div className={styles.cards}>
                <Card
                  key="total-users-card"
                  title="Total Employees"
                  number={counts.userCount}
                  detailText={`${counts.userCount} registered Employees`}
                />
                <Card
                  key="total-client-card"
                  title="Total Managers"
                  number={counts.clientCount}
                  detailText={`${counts.clientCount} registered managers`}
                />
                <Card
                  key="total-suppliers-card"
                  title="Total Departments"
                  number={counts.supplierCount}
                  detailText={`${counts.supplierCount} registered departments`}
                />
              </div>

              <EmployeePassportSlideshow />
              <EmployeeIqamaSlideshow />
            </div>
          </div>
        </Suspense>
      </ErrorBoundary>
    </>
  );
}
