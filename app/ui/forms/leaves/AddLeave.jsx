'use client'
import styles from '@/app/ui/dashboard/employees/addEmployee/addEmployee.module.css';
import React, { useEffect, useState } from 'react'
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation'; 
import { addLeave } from '@/app/lib/actions';
import { ROLES } from '@/app/lib/role';

const leaveSchema = z.object({
  employeeId: z.string().min(1, "Employee selection is required"),
  contactMobile: z.string().min(1, "Contact Mobile is required"),
  leaveType: z.enum(["Annual Leave", "Sick Leave"], { message: "Leave type is required" }),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  addressWhileOnVacation: z.string().optional(),
  exitReentryVisa: z.string(),
});

const AddLeave = ({session}) => {
  const [isEmployee, setIsEmployee] = useState(false);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [exitReentryVisa, setExitReentryVisa] = useState('no');
  const [employees, setEmployees] = useState([]);

  const [formData, setFormData] = useState({
    employeeId: '',
    contactMobile: '',
    leaveType: '',
    startDate: '',
    endDate: '',
    addressWhileOnVacation: '',
  });
  const domain = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const user = session?.user;
      const userRole = user?.role || ROLES.USER;

  // ✅ Determine selected employee object
  const selectedEmployee = employees.find(emp => emp._id === formData.employeeId);

  useEffect(() => {
    setIsEmployee(typeof window !== 'undefined');
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${domain}/api/allEmployees`, { cache: 'no-store', method: 'GET' });
      const data = await response.json();
      console.log('fetchEmployees: Employees fetched:', data);
      setEmployees(data);
      setLoading(false);
    } catch (error) {
      console.error('fetchEmployees: Error fetching employees:', error);
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const leaveActions = async (event) => {
    event.preventDefault();

    const finalFormData = {
      employeeId: formData.employeeId,
      contactMobile: formData.contactMobile,
      leaveType: formData.leaveType,
      startDate: formData.startDate,
      endDate: formData.endDate,
      addressWhileOnVacation: formData.addressWhileOnVacation,
      exitReentryVisa: exitReentryVisa, 
    };

    try {
      leaveSchema.parse(finalFormData);

      if (isEmployee) {
        const result = await addLeave(finalFormData);

        if (result.success) {
          toast.success('Leave request submitted successfully!');
          if (result.success) {
  toast.success('Leave request submitted successfully!');

  if (userRole === 'hrAdmin') {
    router.push('/hr_dashboard/leaves');
  } else {
    router.push('/dashboard/leaves');
  }
} else {
  toast.error(result.message || 'Failed to submit leave request');
}

      } else {
          toast.error(result.message || 'Failed to submit leave request');
        }
      }
    } catch (error) {
      console.error('Error submitting leave request:', error);
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          toast.error(`${err.path.join('.')}: ${err.message}`);
        });
      } else {
        toast.error(error.message || 'An unexpected error occurred');
      }
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Add Leave Request</h1>

      <form onSubmit={leaveActions}>
        <div className={styles.formSections}>
          {/* Left Section */}
          <div className={styles.formSection}>
            <div className={styles.formGroup}>
              {/* Employee Information */}
              <div className={styles.sectionHeader}>Employee Details</div>
              <label className={styles.label}>Employee:</label>
              <select
                className={styles.input}
                value={formData.employeeId}
                onChange={(e) => handleInputChange('employeeId', e.target.value)}
                disabled={loading}
              >
                <option value="">Select Employee</option>
                {employees.length > 0 ? (
                  employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>Loading employees...</option>
                )}
              </select>



              {/* ✅ SHOW LEAVE BALANCE IF EMPLOYEE IS SELECTED */}
             {selectedEmployee && (
  <div
    className={styles.infoBox}
    style={{
      color: selectedEmployee.leaveBalance < 0 ? '#b91c1c' : '#1e3a8a' // optional: red for negative
    }}
  >
    <strong>Current Leave Balance:</strong>{" "}
    {selectedEmployee.leaveBalance !== undefined
      ? selectedEmployee.leaveBalance.toFixed(1)
      : "0.0"}{" "}
    days
  </div>
)}

            </div>

            <div className={styles.formGroup}>
              <div className={styles.sectionHeader}>Contact Information</div>
              <div className={styles.inputRow}>
                <div className={styles.inputContainer}>
                  <label className={styles.label}>Contact Number:</label>
                  <input 
                    className={styles.input} 
                    type="tel" 
                    value={formData.contactMobile}
                    onChange={(e) => handleInputChange('contactMobile', e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div className={styles.inputContainer}>
                <label className={styles.label}>Address while on vacation:</label>
                <textarea
                  className={styles.input}
                  name="address"
                  rows="5"
                  value={formData.addressWhileOnVacation}
                  onChange={(e) => handleInputChange('addressWhileOnVacation', e.target.value)}
                ></textarea>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className={styles.formSection}>
            <div className={styles.formGroup}>
              <div className={styles.sectionHeader}>Leave Details</div>
              <label className={styles.label}>Leave Type:</label>
              <select
                className={styles.input}
                value={formData.leaveType}
                onChange={(e) => handleInputChange('leaveType', e.target.value)}
                required
              >
                <option value="">Select Leave Type</option>
                <option value="Annual Leave">Annual Leave</option>
                <option value="Sick Leave">Sick Leave</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <div className={styles.sectionHeader}>Duration</div>
              <div className={styles.inputRow}>
                <div className={styles.inputContainer}>
                  <label className={styles.label}>Start Date:</label>
                  <input
                    className={styles.input}
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        startDate: e.target.value
                      }))
                    }
                    required
                  />
                </div>

                <div className={styles.inputContainer}>
                  <label className={styles.label}>End Date:</label>
                  <input
                    className={styles.input}
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        endDate: e.target.value
                      }))
                    }
                    required
                  />
                </div>
              </div>
            </div>

            <div className={styles.formGroup}>
              <div className={styles.sectionHeader}>Exit and Re-Entry Visa</div>
              <div className={styles.inputRow} style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="exitReentryVisa"
                    value="yes"
                    checked={exitReentryVisa === 'yes'}
                    onChange={() => setExitReentryVisa('yes')}
                  />
                  Yes
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="exitReentryVisa"
                    value="no"
                    checked={exitReentryVisa === 'no'}
                    onChange={() => setExitReentryVisa('no')}
                  />
                  No
                </label>
              </div>
            </div>
          </div>
        </div>

        <button className={styles.button} type="submit">Request</button>
      </form>
    </div>
  );
}

export default AddLeave;
