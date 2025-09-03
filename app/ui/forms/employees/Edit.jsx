'use client';

import styles from '@/app/ui/dashboard/employees/addEmployee/addEmployee.module.css';
import React, { useEffect, useState, useMemo } from 'react';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { updateEmployee } from '@/app/lib/actions';
import { useSession } from 'next-auth/react';

// --- Helpers ---
function formatDateToISO(dateStr) {
  if (!dateStr) return '';
  // support "DD/MM/YYYY"
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    if (year && month && day) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }
  // already ISO or unknown format -> return as is
  return dateStr;
}

// ---- Validation (id + optional updatable fields) ----
const employeeSchema = z.object({
  id: z.string(),
  employeeNo: z.string().optional(),
  name: z.string().optional(),
  contactMobile: z.string().optional(),
  email: z.string().optional(),
  iqamaNo: z.string().optional(),
  iqamaExpirationDate: z.string().optional(),
  passportNo: z.string().optional(),
  passportExpirationDate: z.string().optional(),
  dateOfBirth: z.string().optional(),
  jobTitle: z.string().optional(),
  // directManager: z.string().optional(), // ❌ removed; manager is derived from department
  contractDuration: z.string().optional(),
  contractStartDate: z.string().optional(),
  contractEndDate: z.string().optional(),
  departmentId: z.string().optional(), // ✅ keep this
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});

const EditEmployee = ({ employee }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = session?.user?.role || 'user';

  const [isClient, setIsClient] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);

  const domain = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const initialDepartmentId = useMemo(() => {
    // works if employee.department is an id or a populated object
    if (!employee?.department) return '';
    return typeof employee.department === 'string'
      ? employee.department
      : employee.department?._id || '';
  }, [employee]);

  const [formData, setFormData] = useState({
    employeeNo: employee.employeeNo || '',
    name: employee.name || '',
    contactMobile: employee.contactMobile || '',
    email: employee.email || '',
    iqamaNo: employee.iqamaNo || '',
    iqamaExpirationDate: employee.iqamaExpirationDate ? formatDateToISO(employee.iqamaExpirationDate) : '',
    passportNo: employee.passportNo || '',
    passportExpirationDate: employee.passportExpirationDate ? formatDateToISO(employee.passportExpirationDate) : '',
    dateOfBirth: employee.dateOfBirth ? formatDateToISO(employee.dateOfBirth) : '',
    jobTitle: employee.jobTitle || '',
    contractDuration: employee.contractDuration || '',
    contractStartDate: employee.contractStartDate ? formatDateToISO(employee.contractStartDate) : '',
    contractEndDate: employee.contractEndDate ? formatDateToISO(employee.contractEndDate) : '',
    departmentId: initialDepartmentId, // ✅ bind department
  });

  // Keep state in sync if parent prop changes (optional)
  useEffect(() => {
    setFormData({
      employeeNo: employee.employeeNo || '',
      name: employee.name || '',
      contactMobile: employee.contactMobile || '',
      email: employee.email || '',
      iqamaNo: employee.iqamaNo || '',
      iqamaExpirationDate: employee.iqamaExpirationDate ? formatDateToISO(employee.iqamaExpirationDate) : '',
      passportNo: employee.passportNo || '',
      passportExpirationDate: employee.passportExpirationDate ? formatDateToISO(employee.passportExpirationDate) : '',
      dateOfBirth: employee.dateOfBirth ? formatDateToISO(employee.dateOfBirth) : '',
      jobTitle: employee.jobTitle || '',
      contractDuration: employee.contractDuration || '',
      contractStartDate: employee.contractStartDate ? formatDateToISO(employee.contractStartDate) : '',
      contractEndDate: employee.contractEndDate ? formatDateToISO(employee.contractEndDate) : '',
      departmentId: initialDepartmentId,
    });
  }, [employee, initialDepartmentId]);

  useEffect(() => {
    setIsClient(typeof window !== 'undefined');
    void fetchDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDepartments = async () => {
    try {
      // 👉 Make sure this endpoint returns each department with directManager populated (name/employeeNo)
      // e.g., Department.find().select('name directManager').populate('directManager','name employeeNo')
      const res = await fetch(`${domain}/api/allDepartments`, { cache: 'no-store' });
      const data = await res.json();
      setDepartments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('fetchDepartments error:', err);
      toast.error('Failed to load departments');
    } finally {
      setDepartmentsLoading(false);
    }
  };

  const selectedDept = useMemo(
    () => departments.find((d) => d._id === formData.departmentId),
    [departments, formData.departmentId]
  );

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const employeeActions = async (e) => {
    e.preventDefault();
    if (!isClient) return;

    const payload = {
      id: employee._id, // ensure id is included
      ...formData,
      // ⛔ do NOT include directManager; the server infers it from department
    };

    try {
      const validated = employeeSchema.parse(payload);
      const result = await updateEmployee(validated);

      if (result?.success) {
        toast.success('Employee updated successfully!');
        if (userRole === 'admin') {
          router.push('/dashboard/employees');
        } else if (userRole === 'hr_admin' || userRole === 'hrAdmin') {
          router.push('/hr_dashboard/employees');
        } else {
          router.push('/dashboard/employees');
        }
      } else {
        toast.error(result?.message || 'Failed to update employee');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => toast.error(`${err.path.join('.')}: ${err.message}`));
      } else {
        console.error('update error:', error);
        toast.error(error?.message || 'Unexpected error');
      }
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Employee Information</h1>

      <form onSubmit={employeeActions}>
        <div className={styles.formSections}>
          {/* Left Section */}
          <div className={styles.formSection}>
            {/* Employee Details */}
            <div className={styles.formGroup}>
              <div className={styles.sectionHeader}>Employee Details</div>

              <div className={styles.inputRow}>
                <div className={styles.inputContainer}>
                  <label className={styles.label}>Employee No:</label>
                  <input
                    className={styles.input}
                    type="text"
                    name="employeeNo"
                    value={formData.employeeNo}
                    onChange={(e) => handleInputChange('employeeNo', e.target.value)}
                  />
                </div>

                <div className={styles.inputContainer}>
                  <label className={styles.label}>Employee Name:</label>
                  <input
                    className={styles.input}
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.inputRow}>
                <div className={styles.inputContainer}>
                  <label className={styles.label}>Employee Phone:</label>
                  <input
                    className={styles.input}
                    type="tel"
                    name="contactMobile"
                    value={formData.contactMobile}
                    onChange={(e) => handleInputChange('contactMobile', e.target.value)}
                  />
                </div>

                <div className={styles.inputContainer}>
                  <label className={styles.label}>Email Address:</label>
                  <input
                    className={styles.input}
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.inputRow}>
                <div className={styles.inputContainer}>
                  <label className={styles.label}>Date of Birth:</label>
                  <input
                    className={styles.input}
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Iqama Details */}
            <div className={styles.formGroup}>
              <div className={styles.sectionHeader}>Iqama Details</div>
              <div className={styles.inputRow}>
                <div className={styles.inputContainer}>
                  <label className={styles.label}>ID / Iqama No:</label>
                  <input
                    className={styles.input}
                    type="text"
                    name="iqamaNo"
                    value={formData.iqamaNo}
                    onChange={(e) => handleInputChange('iqamaNo', e.target.value)}
                  />
                </div>
                <div className={styles.inputContainer}>
                  <label className={styles.label}>Iqama Expiry Date:</label>
                  <input
                    className={styles.input}
                    type="date"
                    name="iqamaExpirationDate"
                    value={formData.iqamaExpirationDate}
                    onChange={(e) => handleInputChange('iqamaExpirationDate', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Passport Information */}
            <div className={styles.formGroup}>
              <div className={styles.sectionHeader}>Passport Information</div>
              <div className={styles.inputRow}>
                <div className={styles.inputContainer}>
                  <label className={styles.label}>Passport No:</label>
                  <input
                    className={styles.input}
                    type="text"
                    name="passportNo"
                    value={formData.passportNo}
                    onChange={(e) => handleInputChange('passportNo', e.target.value)}
                  />
                </div>
                <div className={styles.inputContainer}>
                  <label className={styles.label}>Passport Expiry Date:</label>
                  <input
                    className={styles.input}
                    type="date"
                    name="passportExpirationDate"
                    value={formData.passportExpirationDate}
                    onChange={(e) => handleInputChange('passportExpirationDate', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className={styles.formSection}>
            {/* Job Details */}
            <div className={styles.formGroup}>
              <div className={styles.sectionHeader}>Job Details</div>

              <div className={styles.inputRow}>
                <div className={styles.inputContainer}>
                  <label className={styles.label}>Job Title:</label>
                  <input
                    className={styles.input}
                    type="text"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                  />
                </div>

                {/* Read-only Direct Manager (from selected Department) */}
                <div className={styles.inputContainer}>
                  <label className={styles.label}>Direct Manager (from Department):</label>
                  <input
                    className={styles.input}
                    type="text"
                    value={
                      selectedDept?.directManager
                        ? `${selectedDept.directManager.name}${
                            selectedDept.directManager.employeeNo ? ` (${selectedDept.directManager.employeeNo})` : ''
                          }`
                        : '—'
                    }
                    readOnly
                    disabled
                  />
                </div>
              </div>

              {/* Department selector */}
              <div className={styles.inputRow}>
                <div className={styles.inputContainer}>
                  <label className={styles.label}>Department:</label>
                  <select
                    name="departmentId"
                    className={styles.input}
                    value={formData.departmentId}
                    onChange={(e) => handleInputChange('departmentId', e.target.value)}
                    disabled={departmentsLoading}
                  >
                    <option value="">— None —</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Contract Information */}
            <div className={styles.formGroup}>
              <div className={styles.sectionHeader}>Contract Information</div>

              <div className={styles.inputRow}>
                <div className={styles.inputContainer}>
                  <label className={styles.label}>Contract Duration:</label>
                  <input
                    className={styles.input}
                    type="text"
                    name="contractDuration"
                    value={formData.contractDuration}
                    onChange={(e) => handleInputChange('contractDuration', e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.inputRow}>
                <div className={styles.inputContainer}>
                  <label className={styles.label}>Contract Start Date:</label>
                  <input
                    className={styles.input}
                    type="date"
                    name="contractStartDate"
                    value={formData.contractStartDate}
                    onChange={(e) => handleInputChange('contractStartDate', e.target.value)}
                  />
                </div>

                <div className={styles.inputContainer}>
                  <label className={styles.label}>Contract End Date:</label>
                  <input
                    className={styles.input}
                    type="date"
                    name="contractEndDate"
                    value={formData.contractEndDate}
                    onChange={(e) => handleInputChange('contractEndDate', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden id input (ok to keep) */}
        <input type="hidden" name="id" value={employee._id} />

        <button className={styles.button} type="submit">Edit Information</button>
      </form>
    </div>
  );
};

export default EditEmployee;
