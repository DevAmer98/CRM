'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

const TaskPage = () => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    deadline: '', // ISO string or formatted date
    assignedTo: '',
  });
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

  useEffect(() => {
    if (selected) {
      const formatted = format(selected, 'yyyy-MM-dd', { locale: enUS });
      setForm((prev) => ({ ...prev, deadline: formatted }));
    }
  }, [selected]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${domain}/api/task`, {
        method: 'POST',
        body: JSON.stringify(form),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to create task');
      setForm({ title: '', description: '', deadline: '', assignedTo: '' });
      setSelected(null);
      router.refresh();
      alert('Task sent successfully!');
    } catch (err) {
      console.error(err);
      alert('Error sending task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] p-8">
      <div className="max-w-2xl mx-auto bg-[var(--bgSoft)] rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-semibold mb-6 text-[var(--primary)]">Send New Task</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="title"
            placeholder="Task Title"
            value={form.title}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded"
          />

          <textarea
            name="description"
            placeholder="Task Description"
            value={form.description}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded"
          />

          <div>
            <button
              type="button"
              className="border rounded px-4 py-2 w-full text-left"
              onClick={() => setShowCalendar(!showCalendar)}
            >
              {selected
                ? format(selected, 'yyyy-MM-dd', { locale: enUS })
                : 'Select deadline'}
            </button>

            {showCalendar && (
              <div className="mt-2 p-4 border rounded bg-white shadow z-50 force-english-calendar">
                <DayPicker
                  mode="single"
                  selected={selected}
                  onSelect={(date) => {
                    setSelected(date);
                    setShowCalendar(false);
                  }}
                  locale={enUS}
                  weekStartsOn={0}
                />
              </div>
            )}
          </div>

          <select
            name="assignedTo"
            value={form.assignedTo}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded"
          >
            <option value="">Assign to user</option>
            {users.map((user) => (
              <option key={user._id} value={user._id}>
                {user.username} ({user.role})
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-all"
          >
            {loading ? 'Sending...' : 'Send Task'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TaskPage;
