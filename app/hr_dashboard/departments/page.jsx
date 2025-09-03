import React from 'react';
import styles from '@/app/ui/hr_dashboard/departments/showDepartments.module.css';
import Search from '@/app/ui/hr_dashboard/search/search';
import Link from 'next/link';
import Pagination from '@/app/ui/dashboard/pagination/pagination';
import { fetchDepartments } from '@/app/lib/data';
import DeleteDepartment from '@/app/ui/deleteForms/Department';
import { Building2, CalendarDays, UserRound, UsersRound } from 'lucide-react';

const DepartmentsPage = async ({ searchParams }) => {
  const q = searchParams?.q ?? '';
  const page = Number(searchParams?.page ?? 1);
  const { count, departments } = await fetchDepartments(q, page);

  const fmt = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    if (isNaN(date)) return '—';
    return date.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });
  };

  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <Search placeholder="Search for a Department..." />
        <Link href="/hr_dashboard/departments/add">
          <button className={styles.addButton}>Add New</button>
        </Link>
      </div>

      <div className={styles.cardGrid}>
        {departments.map((department) => {
          const id = department?._id?.toString?.() ?? department?.id;
          const managerName = department?.directManager?.name || department?.directManagerName || '—';
          const employeeCount = Array.isArray(department?.employees)
            ? department.employees.length
            : (department?.employeeCount ?? '—');

        return (
          <div key={id} className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}><Building2 size={18} /></span>
              <h3 className={styles.cardTitle}>{department?.name || 'Untitled'}</h3>
            </div>

            <div className={styles.meta}>
              <div className={styles.metaItem}>
                <CalendarDays className={styles.metaIcon} size={16} />
                <span className={styles.metaLabel}>Created</span>
                <span className={styles.metaValue}>{fmt(department?.createdAt)}</span>
              </div>

              <div className={styles.metaItem}>
                <UserRound className={styles.metaIcon} size={16} />
                <span className={styles.metaLabel}>Manager</span>
                <span className={styles.metaValue}>{managerName}</span>
              </div>

              <div className={styles.metaItem}>
                <UsersRound className={styles.metaIcon} size={16} />
                <span className={styles.metaLabel}>Employees</span>
                <span className={styles.metaValue}>{employeeCount}</span>
              </div>
            </div>

            <div className={styles.buttons}>
              <Link href={`/hr_dashboard/departments/${id}`}>
                <button className={`${styles.button} ${styles.view}`}>View</button>
              </Link>
              <DeleteDepartment departmentId={id} departmentName={department?.name} />
            </div>
          </div>
        )})}

        {departments.length === 0 && (
          <div className={styles.emptyState}>
            <Building2 size={28} />
            <p>No departments found.</p>
          </div>
        )}
      </div>

      <Pagination count={count} />
    </div>
  );
};

export default DepartmentsPage;
