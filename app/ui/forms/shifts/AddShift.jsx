'use client'
import styles from '@/app/ui/hr_dashboard/employees/singleForm.module.css';
import React, { useEffect, useState } from 'react';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { addShift } from '@/app/lib/actions';
import { ROLES } from '@/app/lib/role';

const shiftSchema = z.object({
  employeeId: z.string().min(1, "Employee selection is required"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  location: z.string().min(1, "Location is required"),
});

const AddShift = ({ session }) => {
  const [isClient, setIsClient] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const user = session?.user;
  const userRole = user?.role || ROLES.USER;

  const [formData, setFormData] = useState({
    employeeId: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
  });

  const domain = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  useEffect(() => {
    setIsClient(typeof window !== 'undefined');
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${domain}/api/allEmployees`, { cache: 'no-store', method: 'GET' });
      const data = await response.json();
      setEmployees(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const shiftActions = async (event) => {
    event.preventDefault();

    try {
      shiftSchema.parse(formData);

      if (isClient) {
        const result = await addShift(formData);

        if (result.success) {
          toast.success('Shift submitted successfully!');
          if (userRole === ROLES.HR_ADMIN) {
            router.push('/hr_dashboard/shifts');
          } else {
            router.push('/dashboard/shifts');
          }
        } else {
          toast.error(result.message || 'Failed to submit shift');
        }
      }
    } catch (error) {
      console.error('Error submitting shift:', error);
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
      <h1 className={styles.pageTitle}>Add Shift</h1>

      <form onSubmit={shiftActions}>
        <div className={styles.formSections}>
          <div className={styles.formSection}>
            <div className={styles.formGroup}>
              <div className={styles.sectionHeader}>Employee</div>
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
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Date:</label>
              <input
                className={styles.input}
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Start Time:</label>
              <input
                className={styles.input}
                type="time"
                value={formData.startTime}
                onChange={(e) => handleInputChange('startTime', e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>End Time:</label>
              <input
                className={styles.input}
                type="time"
                value={formData.endTime}
                onChange={(e) => handleInputChange('endTime', e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Location:</label>
              <input
                className={styles.input}
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <button className={styles.button} type="submit">Submit Shift</button>
      </form>
    </div>
  );
};

export default AddShift;
