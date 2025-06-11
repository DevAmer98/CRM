'use client'
import React, { useState } from 'react';
import styles from '@/app/ui/dashboard/approve/approve.module.css';
import { addUser } from '@/app/lib/actions';


const AddUser = () => {
    const [role, setRole] = useState(''); // Initialize role state
  
    // Assuming you have predefined role options or fetch them from somewhere
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
            <div className={styles.inputContainer}>
                    <label  className={styles.label}>
                    Username:
                    </label>
            <input className={styles.input} type="text"  name="username" required />
            </div>
            <div className={styles.inputContainer}>
                    <label  className={styles.label}>
                    Email:
                    </label>
            <input className={styles.input} type="email"  name="email" required />
            </div>
            <div className={styles.inputContainer}>
                    <label  className={styles.label}>
                    Password:
                    </label>
            <input
            className={styles.input}
              type="password"
              name="password"
              required
            />
            </div>
            <div className={styles.inputContainer}>
                    <label  className={styles.label}>
                    Phone:
                    </label>
                <input className={styles.input} type="phone"  name="phone" />
                </div>
                {/* Role Selections */}
                <div className={styles.inputContainer}>
            <label className={styles.label}>Role:</label>
            <select 
                className={styles.input}
                name="role"
                id="role"
                value={role} // Use the state here
                onChange={(e) => setRole(e.target.value)} // Update state on change
            >
              <option value="">Select Role</option>
              {roleOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
        </div>
            <div className={styles.inputContainer}>
                    <label  className={styles.label}>
                    Address:
                    </label>
            <textarea
            className={styles.input}
              name="address"
              id="address"
              rows="16"
              placeholder=""
            ></textarea>
            </div>
            <button className={styles.button} type="submit">Submit</button>
            </form>
        </div>
      )
}

export default AddUser