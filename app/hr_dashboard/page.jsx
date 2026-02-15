'use client';

import styles from '../ui/hr_dashboard/hr_dashboard.module.css';
import Card from '../ui/hr_dashboard/card/card';
import Rightbar from '../ui/hr_dashboard/rightbar/rightbar';
import EmployeePassportSlideshow from '../ui/hr_dashboard/silde/EmployeePassportSlideshow';
import EmployeeIqamaSlideshow from '../ui/hr_dashboard/silde/EmployeeIqamaSlideshow';
import ErrorBoundary from '../ui/dashboard/errorBoundary/errorBoundary';
import { Suspense, useEffect, useState } from 'react';
import { useSession } from "next-auth/react";

export default function HrDashboard() {
  const { data: session, status } = useSession();
  const [counts, setCounts] = useState({
    employeeCount: null,
    managerCount: null,
    departmentCount: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCongrats, setShowCongrats] = useState(false);



useEffect(() => {
  (async () => {
    try {
      const [employeeRes, managerRes, departmentRes] = await Promise.all([
        fetch('/api/allEmployeeCount', { cache: 'no-store' }),
        fetch('/api/allManagersCount', { cache: 'no-store' }),
        fetch('/api/alldepartmentsCount', { cache: 'no-store' }), // fixed D
      ]);

      if (!employeeRes.ok || !managerRes.ok || !departmentRes.ok) {
        console.error({
          employee: employeeRes.status,
          manager: managerRes.status,
          department: departmentRes.status,
        });
        throw new Error('Failed to fetch counts');
      }

      const [employeeData, managerData, departmentData] = await Promise.all([
        employeeRes.json(),
        managerRes.json(),
        departmentRes.json(),
      ]);

      setCounts({
        employeeCount: employeeData?.count ?? 0,
        managerCount: managerData?.count ?? 0,
        departmentCount: departmentData?.count ?? 0,
      });
    } catch (e) {
      setError(e?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  })();
}, []);

useEffect(() => {
  if (status !== "authenticated") return;
  const username = (session?.user?.username || "").toLowerCase();
  const celebratedUsers = ["masteradmin", "lama.zahrani"];
  if (!celebratedUsers.includes(username)) return;

  if (typeof window !== "undefined") {
    const storageKey = `hrCongratsShown:${username}`;
    const alreadyShown = sessionStorage.getItem(storageKey);
    if (!alreadyShown) {
      setShowCongrats(true);
      sessionStorage.setItem(storageKey, "true");
    }
  }
}, [session, status]);


  if (loading) return <p>Loading data...</p>;
  if (error) return <p>Error fetching data: {error}</p>;

  return (
    <>
      {showCongrats && (
        <div className={styles.congratsOverlay}>
          <div className={styles.congratsCard}>
            <h2 className={styles.congratsTitle}>
              Stellar leadership, {(session?.user?.username || "Leader").split("@")[0]}!
            </h2>
            <p className={styles.congratsText}>
              Your HR guidance keeps the team thriving. Thanks for setting the bar so high!
            </p>
            <button
              type="button"
              className={styles.congratsButton}
              onClick={() => setShowCongrats(false)}
            >
              Back to the dashboard
            </button>
          </div>
        </div>
      )}
      <ErrorBoundary>
        <Suspense fallback={<div>Loading...</div>}>
          <div className={styles.wrapper}>
            <div className={styles.main}>
              <div className={styles.cards}>
                <Card
                  key="total-users-card"
                  title="Total Employees"
                  number={counts.employeeCount}
                  detailText={`${counts.employeeCount} registered Employees`}
                />
                <Card
                  key="total-client-card"
                  title="Total Managers"
                  number={counts.managerCount}
                  detailText={`${counts.managerCount} registered managers`}
                />
                <Card
                  key="total-suppliers-card"
                  title="Total Departments"
                  number={counts.departmentCount}
                  detailText={`${counts.departmentCount} registered departments`}
                />
              </div>

              <EmployeePassportSlideshow />
              <EmployeeIqamaSlideshow />
            </div>
            <div className={styles.rightRail}>
              <Rightbar />
            </div>
          </div>
        </Suspense>
      </ErrorBoundary>
    </>
  );
}
