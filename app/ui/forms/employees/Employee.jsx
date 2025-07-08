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
  directManager: z.string(),
  contractDuration: z.string().optional(),
  contractStartDate: z.string().optional(),
  contractEndDate: z.string().optional(),
});

const AddEmployee = () => {
  const [isEmployee, setIsEmployee] = useState(false);
  const router = useRouter();
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState('');
const { data: session } = useSession();
const userRole = session?.user?.role || 'user'; 



  const [formData, setFormData] = useState({
    employeeNo: '',
    name: '',
    contactMobile: '',
    email: '',
    iqamaNo: '',
    iqamaExpirationDate: '',
    passportNo: '',
    passportExpirationDate: '',
    dateOfBirth: '',
    jobTitle: '',
    directManager: '',
    contractDuration: '',
    contractStartDate: '',
    contractEndDate: '',
  });

  const domain = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  useEffect(() => {
    setIsEmployee(typeof window !== 'undefined');
    fetchManagers();
  }, []);

  const fetchManagers = async () => {
    try {
      const response = await fetch(`${domain}/api/allManagers`, {
        cache: 'no-store',
        method: 'GET',
      });
      const data = await response.json();
      setManagers(data);
      setLoading(false);
    } catch (error) {
      console.error('fetchManagers: Error fetching managers:', error);
      setLoading(false);
    }
  };



  

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  

  const employeeActions = async (event) => {
    event.preventDefault();

    try {
      // Validate with zod schema
      const parsedData = employeeSchema.parse(formData);

      const result = await addEmployee(parsedData);

      if (result.success) {
  toast.success('Employee added successfully!');
  if (userRole === 'admin') {
    router.push('/dashboard/employees');
  } else if (userRole === 'hr_admin') {
    router.push('/hr_dashboard/employees');
  } else {
    router.push('/');
  }
}

 else {
        toast.error(result.message || 'Failed to add employee');
      }
    } catch (error) {
      console.error('Error adding employee:', error);

      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          toast.error(`${err.path.join('.')}: ${err.message}`);
        });
      } else if (error.message.includes("already exists")) {
        toast.error(error.message);
      } else {
        toast.error(error.message || 'An unexpected error occurred');
      }
    }
  };

  const renderDateInput = (field, label, required = false) => (
    <div className={styles.inputContainer}>
      <label className={styles.label}>{label}:</label>
      <input
        className={styles.input}
        type="date"
        value={formData[field]}
        onChange={(e) => handleInputChange(field, e.target.value)}
        required={required}
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
                    onChange={(e) => handleInputChange('employeeNo', e.target.value)}
                    required
                  />
                </div>
                <div className={styles.inputContainer}>
                  <label className={styles.label}>Employee Name:</label>
                  <input
                    className={styles.input}
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
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
                    onChange={(e) => handleInputChange('contactMobile', e.target.value)}
                    required
                  />
                </div>
                <div className={styles.inputContainer}>
                  <label className={styles.label}>Email Address:</label>
                  <input
                    className={styles.input}
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
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
                    onChange={(e) => handleInputChange('iqamaNo', e.target.value)}
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
                    onChange={(e) => handleInputChange('passportNo', e.target.value)}
                    required
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
                    onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                    required
                  />
                </div>
                <div className={styles.inputContainer}>
                  <label className={styles.label}>Direct Manager:</label>
                  <select
                    className={styles.input}
                    value={formData.directManager}
                    onChange={(e) => handleInputChange('directManager', e.target.value)}
                    disabled={loading}
                    required
                  >
                    <option value="">Select Direct Manager</option>
                    {managers.length > 0 ? (
                      managers.map((manager) => (
                        <option key={manager._id} value={manager._id}>
                          {manager.username}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>Loading managers...</option>
                    )}
                  </select>
                </div>
              </div>
            </div>

            <div className={styles.formGroup}>
              <div className={styles.sectionHeader}>Contract Information</div>
              <div className={styles.inputRow}>
                <div className={styles.inputContainer}>
                  <label className={styles.label}>Contract Duration:</label>
                  <input
                    className={styles.input}
                    type="text"
                    value={formData.contractDuration}
                    onChange={(e) => handleInputChange('contractDuration', e.target.value)}
                  />
                </div>
              </div>
              <div className={styles.inputRow}>
                {renderDateInput('contractStartDate', 'Contract Start Date')}
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
