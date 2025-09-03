'use client'
import styles from '@/app/ui/dashboard/employees/addEmployee/addEmployee.module.css';
import { addEmployee } from '@/app/lib/actions';
import React, { useEffect, useState } from 'react';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

const employeeSchema = z.object({
  employeeNo: z.string(),
  name: z.string(),
  contactMobile: z.string(),
  email: z.string().optional(),
  iqamaNo: z.string(),
  iqamaExpirationDate: z.string().optional(),
  passportNo: z.string(),
  passportExpirationDate: z.string().optional(),
  dateOfBirth: z.string(),
  jobTitle: z.string(),
  departments: z.string().optional(),
  // Contract fields remain optional on the backend
  contractStartDate: z.string().optional(),
  contractEndDate: z.string().optional(),
  // These are UI-only helpers; you may or may not persist them
  contractDurationValue: z.string().optional(),
  contractDurationUnit: z.enum(['days','months','years']).optional(),
});

const AddEmployee = () => {
  const router = useRouter();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();
  const userRole = session?.user?.role || 'user';

  const [formData, setFormData] = useState({
    employeeNo: '',
    name: '',
    departments: '',
    contactMobile: '',
    email: '',
    iqamaNo: '',
    iqamaExpirationDate: '',
    passportNo: '',
    passportExpirationDate: '',
    dateOfBirth: '',
    jobTitle: '',
    contractStartDate: '',
    contractEndDate: '',
    contractDurationValue: '',      // e.g. "1", "6", "12"
    contractDurationUnit: 'months', // 'days' | 'months' | 'years'
  });

  const domain = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchDepartments();
  }, []);

 

    const fetchDepartments = async () => {
    try {
      const res = await fetch(`${domain}/api/allDepartments`, { cache: 'no-store' });
      const data = await res.json();
      setDepartments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('fetchDepartments error:', err);
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  // ---------- Helpers ----------
  const todayStr = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const fmt = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const addByUnit = (startDateStr, value, unit) => {
    if (!startDateStr || !value || Number.isNaN(Number(value))) return '';
    const n = Number(value);
    const d = new Date(`${startDateStr}T00:00:00`);

    if (unit === 'days') {
      d.setDate(d.getDate() + n);
    } else if (unit === 'months') {
      const day = d.getDate();
      d.setMonth(d.getMonth() + n);
      // If month overflow changed the day (e.g., Jan 31 + 1 month -> Mar 02),
      // you can clamp or leave as-is. We’ll leave as-is (JS default).
    } else if (unit === 'years') {
      d.setFullYear(d.getFullYear() + n);
    }
    return fmt(d);
  };

  const recomputeEndDate = (start, value, unit) => {
    if (!value) return '';
    return addByUnit(start || todayStr(), value, unit);
  };

  // ---------- Handlers that keep end date in sync ----------
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleStartDateChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      contractStartDate: value,
      contractEndDate: recomputeEndDate(value, prev.contractDurationValue, prev.contractDurationUnit),
    }));
  };

  const handleDurationValueChange = (value) => {
    setFormData((prev) => {
      const start = prev.contractStartDate || todayStr();
      return {
        ...prev,
        contractDurationValue: value,
        contractStartDate: prev.contractStartDate || start, // auto-fill start if empty
        contractEndDate: value ? recomputeEndDate(start, value, prev.contractDurationUnit) : prev.contractEndDate,
      };
    });
  };

  const handleDurationUnitChange = (unit) => {
    setFormData((prev) => {
      const start = prev.contractStartDate || todayStr();
      return {
        ...prev,
        contractDurationUnit: unit,
        contractStartDate: prev.contractStartDate || start,
        contractEndDate: prev.contractDurationValue
          ? recomputeEndDate(start, prev.contractDurationValue, unit)
          : prev.contractEndDate,
      };
    });
  };

  // ---------- Submit ----------
  const employeeActions = async (e) => {
    e.preventDefault();
    try {
      // If you do not want to persist the helper fields, strip them here
      const payload = { ...formData };
      const parsedData = employeeSchema.parse(payload);

      const result = await addEmployee(parsedData);
      if (result?.success) {
        toast.success('Employee added successfully!');
        if (userRole === 'admin') {
          router.push('/dashboard/employees');
        } else if (userRole === 'hr_admin') {
          router.push('/hr_dashboard/employees');
        } else {
          router.push('/');
        }
      } else {
        toast.error(result?.message || 'Failed to add employee');
      }
    } catch (error) {
      console.error('Error adding employee:', error);
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => toast.error(`${err.path.join('.')}: ${err.message}`));
      } else {
        toast.error(error?.message || 'An unexpected error occurred');
      }
    }
  };

  // ---------- Small helper to render date input ----------
  const renderDateInput = (field, label, required = false, onChangeOverride) => (
    <div className={styles.inputContainer}>
      <label className={styles.label}>{label}:</label>
      <input
        className={styles.input}
        type="date"
        value={formData[field] || ''}
        onChange={(e) => (onChangeOverride ? onChangeOverride(e.target.value) : handleChange(field, e.target.value))}
      />
    </div>
  );

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Add New Employee</h1>
      <form onSubmit={employeeActions}>
        <div className={styles.formSections}>
          {/* Left Section */}
          <div className={styles.formSection}>
            <div className={styles.formGroup}>
              <div className={styles.sectionHeader}>Employee Details</div>
              <div className={styles.inputRow}>
                <div className={styles.inputContainer}>
                  <label className={styles.label}>Employee No:</label>
                  <input
                    className={styles.input}
                    type="text"
                    value={formData.employeeNo}
                    onChange={(e) => handleChange('employeeNo', e.target.value)}
                    required
                  />
                </div>
                <div className={styles.inputContainer}>
                  <label className={styles.label}>Employee Name:</label>
                  <input
                    className={styles.input}
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className={styles.inputRow}>
                <div className={styles.inputContainer}>
                  <label className={styles.label}>Employee Phone:</label>
                  <input
                    className={styles.input}
                    type="tel"
                    value={formData.contactMobile}
                    onChange={(e) => handleChange('contactMobile', e.target.value)}
                    required
                  />
                </div>
                <div className={styles.inputContainer}>
                  <label className={styles.label}>Email Address:</label>
                  <input
                    className={styles.input}
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                  />
                </div>
              </div>
              <div className={styles.inputRow}>
                {renderDateInput('dateOfBirth', 'Date of Birth', true)}
              </div>
            </div>

            <div className={styles.formGroup}>
              <div className={styles.sectionHeader}>Iqama Details</div>
              <div className={styles.inputRow}>
                <div className={styles.inputContainer}>
                  <label className={styles.label}>ID or Iqama No:</label>
                  <input
                    className={styles.input}
                    type="text"
                    value={formData.iqamaNo}
                    onChange={(e) => handleChange('iqamaNo', e.target.value)}
                    required
                  />
                </div>
                {renderDateInput('iqamaExpirationDate', 'ID or Iqama Expiry Date')}
              </div>
            </div>

            <div className={styles.formGroup}>
              <div className={styles.sectionHeader}>Passport Information</div>
              <div className={styles.inputRow}>
                <div className={styles.inputContainer}>
                  <label className={styles.label}>Passport No:</label>
                  <input
                    className={styles.input}
                    type="text"
                    value={formData.passportNo}
                    onChange={(e) => handleChange('passportNo', e.target.value)}
                  />
                </div>
                {renderDateInput('passportExpirationDate', 'Passport Expiry Date')}
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className={styles.formSection}>
            <div className={styles.formGroup}>
              <div className={styles.sectionHeader}>Job Details</div>
              <div className={styles.inputRow}>
                <div className={styles.inputContainer}>
                  <label className={styles.label}>Job Title:</label>
                  <input
                    className={styles.input}
                    type="text"
                    value={formData.jobTitle}
                    onChange={(e) => handleChange('jobTitle', e.target.value)}
                    required
                  />
                </div>
                <div className={styles.inputContainer}>
                  <label className={styles.label}>Deparment:</label>
                  <select
                    className={styles.input}
                    value={formData.departments}
                    onChange={(e) => handleChange('departments', e.target.value)}
                    disabled={loading}
                    
                  >
                    <option value="">Select Department</option>
                    {departments.length > 0 ? (
                      departments.map((department) => (
                        <option key={department._id} value={department._id}>
                          {department.name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>Loading Departments...</option>
                    )}
                  </select>
                </div>
              </div>
            </div>

            <div className={styles.formGroup}>
              <div className={styles.sectionHeader}>Contract Information</div>

              {/* Duration controls */}
              <div className={styles.inputRow}>
                <div className={styles.inputContainer}>
                  <label className={styles.label}>Duration Amount:</label>
                  <input
                    className={styles.input}
                    type="number"
                    min="0"
                    placeholder="e.g., 1, 6, 12"
                    value={formData.contractDurationValue}
                    onChange={(e) => handleDurationValueChange(e.target.value)}
                  />
                </div>

                <div className={styles.inputContainer}>
                  <label className={styles.label}>Duration Unit:</label>
                  <select
                    className={styles.input}
                    value={formData.contractDurationUnit}
                    onChange={(e) => handleDurationUnitChange(e.target.value)}
                  >
                    <option value="days">Day(s)</option>
                    <option value="months">Month(s)</option>
                    <option value="years">Year(s)</option>
                  </select>
                </div>
              </div>

              <div className={styles.inputRow}>
                {renderDateInput('contractStartDate', 'Contract Start Date', false, handleStartDateChange)}
                {renderDateInput('contractEndDate', 'Contract End Date')}
              </div>
            </div>
          </div>
        </div>

        <button className={styles.button} type="submit">Add Employee</button>
      </form>
    </div>
  );
};

export default AddEmployee;
