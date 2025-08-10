import React from 'react';
import styles from '@/app/ui/hr_dashboard/employees/employees.module.css';
import Search from '@/app/ui/hr_dashboard/search/search';
import Link from 'next/link';
import Pagination from '@/app/ui/dashboard/pagination/pagination';
import { fetchShifts } from '@/app/lib/data'; 

const ShiftsPage = async ({ searchParams }) => {
  const q = searchParams?.q || "";
  const page = parseInt(searchParams?.page) || 1;

  const { count, shifts } = await fetchShifts(q, page);

  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <Search placeholder="Search for a shift or employee..." />
        <Link href='/hr_dashboard/shifts/add'>
          <button className={styles.addButton}>Add New</button>        
        </Link>
      </div>

      <table className={styles.table}> 
        <thead>
          <tr>
            <td>Employee Name</td>
            <td>Date</td>
            <td>Start Time</td>
            <td>End Time</td>
            <td>Actions</td>
          </tr>
        </thead>
        <tbody>
          {shifts?.map((shift) => (
            <tr key={shift._id}>
              <td>{shift.employee?.name || 'N/A'}</td>
              <td>{new Date(shift.date).toLocaleDateString()}</td>
              <td>{shift.startTime}</td>
              <td>{shift.endTime}</td>
              <td>
                <div className={styles.buttons}>
                  <Link href={`/hr_dashboard/shifts/${shift._id}`}>
                    <button className={`${styles.button} ${styles.view}`}>View</button>
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination count={count} />
    </div>
  );
};

export default ShiftsPage;
