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
    employeeCount: null,
    managerCount: null,
    departmentCount: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);



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
          </div>
        </Suspense>
      </ErrorBoundary>
    </>
  );
}
