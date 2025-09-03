// app/hr_dashboard/departments/[id]/page.jsx
import styles from '@/app/ui/hr_dashboard/departments/singleDepartment.module.css';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchDepartment } from '@/app/lib/data';
import {
  Building2, CalendarDays, UserRound, UsersRound, Briefcase, Phone, Mail, ArrowLeft
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DepartmentPage({ params }) {
  const id = params?.id;
  if (!id) notFound();

  const department = await fetchDepartment(id);
  if (!department) notFound();

  const created = department?.createdAt ? new Date(department.createdAt) : null;
  const createdStr = created
    ? created.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' })
    : '—';

  const manager = department?.directManager || null;
  const employees = department?.employees || [];
  const employeeCount = department?.employeeCount ?? employees.length;

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div className={styles.titleWrap}>
          <span className={styles.titleIcon}><Building2 size={20} /></span>
          <h1 className={styles.pageTitle}>{department?.name || 'Department'}</h1>
        </div>
        <Link href="/hr_dashboard/departments" className={styles.ghostBtn}>
          <ArrowLeft size={16} />
          <span>Back</span>
        </Link>
      </div>

      <div className={styles.metaGrid}>
        <div className={styles.metaCard}>
          <div className={styles.metaHeader}>
            <CalendarDays className={styles.metaIcon} size={16} />
            <span className={styles.metaLabel}>Created</span>
          </div>
          <div className={styles.metaValue}>{createdStr}</div>
        </div>
        <div className={styles.metaCard}>
          <div className={styles.metaHeader}>
            <UsersRound className={styles.metaIcon} size={16} />
            <span className={styles.metaLabel}>Employees</span>
          </div>
          <div className={styles.metaValue}>{employeeCount}</div>
        </div>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Direct Manager</h2>
        {!manager ? (
          <div className={styles.emptyCard}>No manager assigned.</div>
        ) : (
          <div className={styles.managerCard}>
            <div className={styles.managerMain}>
              <UserRound className={styles.managerAvatar} size={28} />
              <div className={styles.managerText}>
                <div className={styles.managerName}>
                  {manager.name} {manager.employeeNo ? `(${manager.employeeNo})` : ''}
                </div>
                <div className={styles.managerSub}>
                  <Briefcase size={14} /> <span>{manager.jobTitle || '—'}</span>
                </div>
              </div>
            </div>
            <div className={styles.managerContact}>
              {manager.contactMobile && (
                <a className={styles.contactItem} href={`tel:${manager.contactMobile}`}>
                  <Phone size={14} /> {manager.contactMobile}
                </a>
              )}
              {manager.email && (
                <a className={styles.contactItem} href={`mailto:${manager.email}`}>
                  <Mail size={14} /> {manager.email}
                </a>
              )}
            </div>
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Employees</h2>
        {employeeCount === 0 ? (
          <div className={styles.emptyCard}>No employees in this department yet.</div>
        ) : (
          <ul className={styles.memberGrid}>
            {employees.map((e) => (
              <li key={e._id} className={styles.memberCard}>
                <div className={styles.memberTop}>
                  <div className={styles.memberAvatar}><UserRound size={16} /></div>
                  <div className={styles.memberName}>{e.name}</div>
                  {e.employeeNo && <span className={styles.memberNo}>#{e.employeeNo}</span>}
                </div>
                <div className={styles.memberRole}>
                  <Briefcase size={12} /> <span>{e.jobTitle || '—'}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
