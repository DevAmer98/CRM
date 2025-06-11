import React from 'react'
import styles from '@/app/ui/dashboard/approve/approve.module.css';
import { addSale } from '@/app/lib/actions';

const AddSalesPage = () => {
  return (
    <div className={styles.container}>
        <form action={addSale} className={styles.form}>
        <div className={styles.inputContainer}>
                <label  className={styles.label}>
                Name:
                </label>
        <input className={styles.input} type="text"  name="name" required />
        </div>
        <div className={styles.inputContainer}>
                <label  className={styles.label}>
                Phone:
                </label>
        <input className={styles.input} type="phone"  name="phone" required />
        </div>
        <div className={styles.inputContainer}>
                <label  className={styles.label}>
                Contact Name:
                </label>
        <input className={styles.input} type="text"  name="contactName" />
        </div>
        <div className={styles.inputContainer}>
                <label  className={styles.label}>
                Contact Mobile:
                </label>
        <input className={styles.input} type="phone"  name="contactMobile" />
        </div>
        <div className={styles.inputContainer}>
                <label  className={styles.label}>
                Email Address:
                </label>
        <input className={styles.input} type="email"  name="email" />
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
        ></textarea>
        </div>
        <button className={styles.button} type="submit">Submit</button>
        </form>
    </div>
  )
}

export default AddSalesPage