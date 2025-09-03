'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from '@/app/ui/hr_dashboard/employees/singleForm.module.css';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { updateShift } from '@/app/lib/actions';

const shiftEditSchema = z.object({
  id: z.string(),
  employeeId: z.string().min(1, 'Employee is required'),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Use time as HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Use time as HH:MM'),
  shiftType: z.string().optional(),      // make required if your schema requires it
  location: z.string().min(1, 'Location is required'),
  description: z.string().optional(),
}).refine((data) => {
  const [sh, sm] = data.startTime.split(':').map(Number);
  const [eh, em] = data.endTime.split(':').map(Number);
  return eh * 60 + em > sh * 60 + sm;
}, { path: ['endTime'], message: 'End time must be after start time' });

const EditShift = ({ shift }) => {
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const dateRef = useRef(null);
  const startRef = useRef(null);
  const endRef = useRef(null);

  const domain = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const initial = useMemo(() => ({
    id: shift._id,
    employeeId: typeof shift.employee === 'string' ? shift.employee : (shift.employee?._id || ''),
    date: shift.date || '',
    startTime: shift.startTime || '',
    endTime: shift.endTime || '',
    shiftType: shift.shiftType || '',
    location: shift.location || '',
    description: shift.description || '',
  }), [shift]);

  const [formData, setFormData] = useState(initial);

  useEffect(() => {
    setFormData(initial);
  }, [initial]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${domain}/api/allEmployees`, { cache: 'no-store' });
        const data = await res.json();
        setEmployees(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        toast.error('Failed to load employees');
      } finally {
        setLoading(false);
      }
    })();
  }, [domain]);

  const handleInputChange = (field, value) => {
    setFormData((p) => ({ ...p, [field]: value }));
  };

  const openNativePicker = (inputEl) => {
    if (!inputEl) return;
    try {
      if (typeof inputEl.showPicker === 'function') inputEl.showPicker();
      else inputEl.focus();
    } catch {
      inputEl.focus();
    }
  };

  const makePickerHandlers = (ref) => ({
    onClick: () => openNativePicker(ref.current),
    onMouseDown: (e) => { e.preventDefault(); openNativePicker(ref.current); },
    onTouchStart: (e) => { e.preventDefault(); openNativePicker(ref.current); },
    onFocus: () => openNativePicker(ref.current),
    role: 'group',
    tabIndex: 0,
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openNativePicker(ref.current);
      }
    },
  });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      shiftEditSchema.parse(payload);

      const res = await updateShift(payload);
      if (res?.success) {
        toast.success('Shift updated!');
        router.push(`/hr_dashboard/shifts/${shift._id}`); // you can also go back to list
      } else {
        toast.error(res?.message || 'Failed to update shift');
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        err.errors.forEach((er) => toast.error(`${er.path.join('.')}: ${er.message}`));
      } else {
        console.error(err);
        toast.error(err?.message || 'Unexpected error');
      }
    }
  };

  return (
    <form onSubmit={onSubmit}>
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
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} {emp.employeeNo ? `(${emp.employeeNo})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Date:</label>
            <div className={styles.pickerWrapper} {...makePickerHandlers(dateRef)}>
              <input
                ref={dateRef}
                className={styles.input}
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
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
                step="60"
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
                required
              />
            </div>
          </div>

          {/* Shift Type (optional: make required if your schema requires) */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Shift Type:</label>
            <select
              className={styles.input}
              value={formData.shiftType}
              onChange={(e) => handleInputChange('shiftType', e.target.value)}
            >
              <option value="">Select type</option>
              <option value="morning">Morning</option>
              <option value="evening">Evening</option>
              <option value="night">Night</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Location */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Location:</label>
            <input
              className={styles.input}
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="e.g., HQ, Remote, Site A"
              required
            />
          </div>
        </div>
      </div>

      <input type="hidden" value={formData.id} />

      <button className={styles.button} type="submit">
        Save Changes
      </button>
    </form>
  );
};

export default EditShift;
