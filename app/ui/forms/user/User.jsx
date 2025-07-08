'use client'
import React, { useEffect, useState } from 'react';
import styles from '@/app/ui/dashboard/approve/approve.module.css';
import { addUser } from '@/app/lib/actions';

const AddUser = () => {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [isEmployee, setIsEmployee] = useState(false);
  const domain = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const [formData, setFormData] = useState({
    employeeId: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    role: '',
    isActive: true, // default active
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

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

  const roleOptions = [
    { value: 'admin', label: 'Admin' },
    { value: 'salesAdmin', label: 'Sales Admin' },
    { value: 'proAdmin', label: 'Procurement Admin' },
    { value: 'userPro', label: 'User Procurement' },
    { value: 'salesUser', label: 'Sales User' },
    { value: 'dashboardAdmin', label: 'Dashboard Admin' },
    { value: 'hrAdmin', label: 'HR Admin' }
  ];

  return (
    <div className={styles.container}>
      <form action={addUser} className={styles.form}>
        {/* Employee Selection */}
        <div className={styles.inputContainer}>
          <label className={styles.label}>Employee:</label>
          <select
            className={styles.input}
            name="employeeId"
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
              <option value="" disabled>Loading employees...</option>
            )}
          </select>
        </div>

        {/* Username */}
        <div className={styles.inputContainer}>
          <label className={styles.label}>Username:</label>
          <input
            className={styles.input}
            type="text"
            name="username"
            value={formData.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            required
          />
        </div>

        {/* Email */}
        <div className={styles.inputContainer}>
          <label className={styles.label}>Email:</label>
          <input
            className={styles.input}
            type="email"
            name="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            required
          />
        </div>

        {/* Password */}
        <div className={styles.inputContainer}>
          <label className={styles.label}>Password:</label>
          <input
            className={styles.input}
            type="password"
            name="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            required
          />
        </div>

        {/* Phone */}
        <div className={styles.inputContainer}>
          <label className={styles.label}>Phone:</label>
          <input
            className={styles.input}
            type="phone"
            name="phone"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
          />
        </div>

        {/* Role Selection */}
        <div className={styles.inputContainer}>
          <label className={styles.label}>Role:</label>
          <select
            className={styles.input}
            name="role"
            value={formData.role}
            onChange={(e) => handleInputChange('role', e.target.value)}
            required
          >
            <option value="">Select Role</option>
            {roleOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Address */}
        <div className={styles.inputContainer}>
          <label className={styles.label}>Address:</label>
          <textarea
            className={styles.input}
            name="address"
            rows="4"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
          ></textarea>
        </div>

        {/* IsActive Toggle */}
        <div className={styles.inputContainer}>
          <label className={styles.label}>Active:</label>
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => handleInputChange('isActive', e.target.checked)}
          />
        </div>

        <button className={styles.button} type="submit">Submit</button>
      </form>
    </div>
  )
}

export default AddUser;
