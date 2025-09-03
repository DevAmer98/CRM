'use client';

import styles from '@/app/ui/hr_dashboard/employees/singleForm.module.css';
import React, { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { addShift } from '@/app/lib/actions';
import { ROLES } from '@/app/lib/role';

const shiftSchema = z.object({
  employeeId: z.string().min(1, 'Employee selection is required'),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Use time as HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Use time as HH:MM'),
  location: z.string().min(1, 'Location is required'),
}).refine((data) => {
  const [sh, sm] = data.startTime.split(':').map(Number);
  const [eh, em] = data.endTime.split(':').map(Number);
  return eh * 60 + em > sh * 60 + sm;
}, {
  path: ['endTime'],
  message: 'End time must be after start time',
});

const AddShift = ({ session }) => {
  const [isClient, setIsClient] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const user = session?.user;
  const userRole = user?.role || ROLES.USER;

  // Refs to trigger native pickers
  const dateRef = useRef(null);
  const startRef = useRef(null);
  const endRef = useRef(null);

  const [formData, setFormData] = useState({
    employeeId: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
  });

  const domain = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  useEffect(() => {
    setIsClient(typeof window !== 'undefined');
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${domain}/api/allEmployees`, { cache: 'no-store', method: 'GET' });
      const data = await response.json();
      setEmployees(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setLoading(false);
      toast.error('Failed to load employees');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Helper: open native picker if supported; otherwise focus as a fallback
  const openNativePicker = (inputEl) => {
    if (!inputEl) return;
    try {
      if (typeof inputEl.showPicker === 'function') {
        inputEl.showPicker(); // Chromium
      } else {
        inputEl.focus();      // Safari/Firefox fallback
        // On some mobile browsers, focusing is enough to show the picker UI
      }
    } catch {
      inputEl.focus();
    }
  };

  // A generic wrapper handler so clicking anywhere in the field opens the picker
  const makePickerHandlers = (ref) => ({
    onClick: () => openNativePicker(ref.current),
    onMouseDown: (e) => {
      // Prevent text selection delaying the click on some browsers
      e.preventDefault();
      openNativePicker(ref.current);
    },
    onTouchStart: (e) => {
      e.preventDefault(); // improves responsiveness on mobile
      openNativePicker(ref.current);
    },
    onFocus: () => openNativePicker(ref.current),
    role: 'group',
    tabIndex: 0, // make the wrapper focusable for keyboard users
    onKeyDown: (e) => {
      // Enter/Space also opens it
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openNativePicker(ref.current);
      }
    },
  });

  const shiftActions = async (event) => {
    event.preventDefault();

    try {
      shiftSchema.parse(formData);
      if (!isClient) return;

      const result = await addShift(formData);

      if (result?.success) {
        toast.success('Shift submitted successfully!');
        if (userRole === ROLES.HR_ADMIN) {
          router.push('/hr_dashboard/shifts');
        } else {
          router.push('/dashboard/shifts');
        }
      } else {
        toast.error(result?.message || 'Failed to submit shift');
      }
    } catch (error) {
      console.error('Error submitting shift:', error);
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          toast.error(`${err.path.join('.')}: ${err.message}`);
        });
      } else {
        toast.error(error?.message || 'An unexpected error occurred');
      }
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Add Shift</h1>

      <form onSubmit={shiftActions}>
        <div className={styles.formSections}>
          <div className={styles.formSection}>
            {/* Employee */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Employee:</label>
              <select
                className={styles.input}
                value={formData.employeeId}
                onChange={(e) => handleInputChange('employeeId', e.target.value)}
                disabled={loading}
                required
              >
                <option value="">Select Employee</option>
                {employees.length > 0 ? (
                  employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    Loading employees...
                  </option>
                )}
              </select>
            </div>

            {/* Date (wrapper opens the picker) */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Date:</label>
              <div className={styles.pickerWrapper} {...makePickerHandlers(dateRef)}>
                <input
                  ref={dateRef}
                  className={styles.input}
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  // readOnly is optional; can reduce mobile keyboards interfering.
                  // readOnly
                  required
                />
              </div>
            </div>

            {/* Start Time */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Start Time:</label>
              <div className={styles.pickerWrapper} {...makePickerHandlers(startRef)}>
                <input
                  ref={startRef}
                  className={styles.input}
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  step="60" // 1-minute increments
                  // readOnly
                  required
                />
              </div>
            </div>

            {/* End Time */}
            <div className={styles.formGroup}>
              <label className={styles.label}>End Time:</label>
              <div className={styles.pickerWrapper} {...makePickerHandlers(endRef)}>
                <input
                  ref={endRef}
                  className={styles.input}
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  step="60"
                  // readOnly
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Location:</label>
              <textarea
                className={styles.input}
                rows="4"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <button className={styles.button} type="submit">
          Submit Shift
        </button>
      </form>
    </div>
  );
};

export default AddShift;
