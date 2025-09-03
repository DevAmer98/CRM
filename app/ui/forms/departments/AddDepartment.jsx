'use client'

import styles from '@/app/ui/hr_dashboard/departments/departments.module.css';
import React, { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { addDepartment } from '@/app/lib/actions';
import { Building2, UserRound } from 'lucide-react';

const deptSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
  directManagerId: z.string().min(1, 'Direct manager is required'),
});

export default function AddDepartment() {
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = session?.user?.role || 'user';

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    directManagerId: '',
  });

  const domain = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  useEffect(() => {
    (async () => {
      try {
        // Use your existing endpoint; switch to /api/allManagers if you have it
        const res = await fetch(`${domain}/api/allEmployees`, { cache: 'no-store' });
        const data = await res.json();
        setEmployees(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('fetch employees error:', err);
        toast.error('Failed to load employees');
      } finally {
        setLoading(false);
      }
    })();
  }, [domain]);

  const selectedManager = useMemo(
    () => employees.find(e => e._id === formData.directManagerId),
    [employees, formData.directManagerId]
  );

  const handleChange = (field, value) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const parsed = deptSchema.parse(formData);
      const res = await addDepartment({
        name: parsed.name,
        directManagerId: parsed.directManagerId,
        // employeeIds optional; addDepartment will include the manager automatically
      });

      if (res?.success) {
        toast.success('Department created!');
        if (userRole === 'hr_admin' || userRole === 'hrAdmin') {
          router.push('/hr_dashboard/departments');
        } else {
          router.push('/dashboard/departments');
        }
      } else {
        toast.error(res?.message || 'Failed to create department');
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        err.errors.forEach(er => toast.error(`${er.path.join('.')}: ${er.message}`));
      } else {
        console.error('submit error:', err);
        toast.error(err?.message || 'Unexpected error');
      }
    }
  };

  return (
    <div className={`${styles.container} ${styles.compact}`}>
      <div className={styles.headerRow}>
        <h1 className={styles.pageTitle}>Add Department</h1>
        <span className={styles.badge}>2 fields</span>
      </div>

      <div className={styles.gridTwoTight}>
        {/* Form card */}
        <section className={styles.formCard}>
          <div className={styles.sectionHeader}>Department Details</div>

          <div className={styles.formGroup}>
            <div className={styles.inputContainer}>
              <label className={styles.label}>Department Name</label>
              <div className={styles.inputWrapper}>
                <Building2 className={styles.inputIcon} size={18} />
                <input
                  className={styles.inputWithIcon}
                  type="text"
                  placeholder="e.g., Finance, IT, HR"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className={styles.inputContainer}>
              <label className={styles.label}>Direct Manager (Employee)</label>
              <div className={styles.inputWrapper}>
                <UserRound className={styles.inputIcon} size={18} />
                <select
                  className={styles.inputWithIcon}
                  value={formData.directManagerId}
                  onChange={(e) => handleChange('directManagerId', e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="">Select Manager</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} {emp.employeeNo ? `(${emp.employeeNo})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <small className={styles.helpText}>Assign an existing employee as the department’s manager.</small>
            </div>
          </div>

          <button className={styles.button} type="submit" onClick={onSubmit}>
            Create Department
          </button>
        </section>

        {/* Preview / helper card */}
        <aside className={styles.previewCard}>
          <div className={styles.previewHeader}>
            <span className={styles.previewTitle}>Preview</span>
          </div>

          {!selectedManager ? (
            <div className={styles.previewEmpty}>
              <p>Select a manager to see their basic info here.</p>
              <ul>
                <li>Name</li>
                <li>Employee No.</li>
                <li>Job Title</li>
                <li>Contact</li>
              </ul>
            </div>
          ) : (
            <div className={styles.previewBody}>
              <div className={styles.previewRow}>
                <span className={styles.previewLabel}>Department</span>
                <span className={styles.previewValue}>{formData.name || '-'}</span>
              </div>
              <div className={styles.previewRow}>
                <span className={styles.previewLabel}>Manager</span>
                <span className={styles.previewValue}>{selectedManager.name}</span>
              </div>
              <div className={styles.previewRow}>
                <span className={styles.previewLabel}>Employee No.</span>
                <span className={styles.previewValue}>{selectedManager.employeeNo || '—'}</span>
              </div>
              <div className={styles.previewRow}>
                <span className={styles.previewLabel}>Job Title</span>
                <span className={styles.previewValue}>{selectedManager.jobTitle || '—'}</span>
              </div>
              <div className={styles.previewRow}>
                <span className={styles.previewLabel}>Contact</span>
                <span className={styles.previewValue}>{selectedManager.contactMobile || selectedManager.email || '—'}</span>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
