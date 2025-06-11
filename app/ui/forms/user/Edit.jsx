'use client'
import React, { useState, useEffect } from 'react';
import styles from '@/app/ui/dashboard/approve/approve.module.css';
import { updateUser } from '@/app/lib/actions';

const Edit = ({ user }) => {
    const [role, setRole] = useState('');

    const roleOptions = [
        { value: 'admin', label: 'Admin' },
        { value: 'salesAdmin', label: 'Sales Admin' },
        { value: 'proAdmin', label: 'Procurement Admin' },
        { value: 'userPro', label: 'User Procurement' },
        { value: 'salesUser', label: 'Sales User' },
        { value: 'hrAdmin', label: 'HR Admin' }
      ];

    useEffect(() => {
        if (user && user.role) {
            setRole(user.role);
        }
    }, [user]);

    return (
        <div className={styles.formContainer}>
            <form action={updateUser} className={styles.form}>
                <input className={styles.input} type='hidden' name='id' value={user.id} />
                <div className={styles.inputContainer}>
                    <label className={styles.label}>
                        Username:
                    </label>
                    <input className={styles.input} type='text' name='username' placeholder={user.username} />
                </div>
                <div className={styles.inputContainer}>
                    <label className={styles.label}>
                        Email:
                    </label>
                    <input className={styles.input} type='email' name='email' placeholder={user.email} />
                </div>
                <div className={styles.inputContainer}>
                    <label className={styles.label}>
                        Password:
                    </label>
                    <input className={styles.input} type='password' name='password' />
                </div>
                <div className={styles.inputContainer}>
                    <label className={styles.label}>
                        Phone:
                    </label>
                    <input className={styles.input} type='text' name='phone' placeholder={user.phone} />
                </div>
                <div className={styles.inputContainer}>
                    <label className={styles.label}>
                        Address:
                    </label>
                    <textarea className={styles.input} name='address' placeholder={user.address} />
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
                    <label className={styles.label}>
                        IsActive?
                    </label>
                    <select className={styles.input} name='isActive' defaultValue={user.isActive}>
                        <option value={true}>Yes</option>
                        <option value={false}>No</option>
                    </select>
                </div>
                <button className={styles.button}>Update</button>
            </form>
        </div>
    );
}

export default Edit;
