'use client';
import styles from '../task/task.module.css';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

const TicketForm = ({ onClose, onTicketCreated }) => { 
  const [form, setForm] = useState({ title: '', description: '', deadline: '', assignedTo: '' });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const router = useRouter();
  const domain = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${domain}/api/allUsers`);
        const data = await res.json();
        setUsers(data);
      } catch (error) {
        console.error('Failed to load users:', error);
      }
    };
    fetchUsers();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    const res = await fetch(`${domain}/api/ticket`, {
      method: 'POST',
      body: JSON.stringify(form),
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to create ticket');

    setForm({ title: '', description: '', deadline: '', assignedTo: '' });
    onTicketCreated?.(); // 🔥 call reloadTasks passed from parent
    onClose?.();
    alert('Ticket sent successfully!');
  } catch (err) {
    console.error(err);
    alert('Error sending ticket');
  } finally {
    setLoading(false);
  }
};


  return (
    <form onSubmit={handleSubmit} className={styles.formContainer}>
      {/* Title */}
      <div className={styles.fieldGroup}>
        <label htmlFor="title" className={styles.label}>
          Ticket Title
        </label>
        <input
          type="text"
          name="title"
          id="title"
          placeholder="e.g. Prepare weekly report"
          value={form.title}
          onChange={handleChange}
          required
          className={styles.input}
        />
      </div>

      {/* Description */}
      <div className={styles.fieldGroup}>
        <label htmlFor="description" className={styles.label}>
          Description
        </label>
        <textarea
          name="description"
          id="description"
          rows={4}
          placeholder="Add some details about the task..."
          value={form.description}
          onChange={handleChange}
          className={styles.textarea}
        />
      </div>

      {/* Deadline */}
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Deadline</label>
        <button
          type="button"
          onClick={() => setShowCalendar(!showCalendar)}
          className={styles.deadlineButton}
        >
          {selected
            ? format(selected, 'yyyy-MM-dd', { locale: enUS })
            : 'Select a deadline'}
        </button>

        {showCalendar && (
          <div className={styles.calendarContainer}>
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={(date) => {
                setSelected(date);
                setForm((prev) => ({
                  ...prev,
                  deadline: date ? format(date, 'yyyy-MM-dd') : '',
                }));
                setShowCalendar(false);
              }}
              locale={enUS}
              weekStartsOn={0}
            />
          </div>
        )}
      </div>

      {/* Assigned To */}
      <div className={styles.fieldGroup}>
        <label htmlFor="assignedTo" className={styles.label}>
          Assign To
        </label>
        <select
          name="assignedTo"
          id="assignedTo"
          value={form.assignedTo}
          onChange={handleChange}
          required
          className={styles.select}
        >
          <option value="">Select a user</option>
          {users.map(user => (
            <option key={user._id} value={user._id}>
              {user.username} ({user.role})
            </option>
          ))}
        </select>
      </div>

      {/* Submit Button */}
      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className={styles.submitButton}
        >
          {loading ? 'Sending...' : (
            <>
              <span>Send Ticket</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default TicketForm;
