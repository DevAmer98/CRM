import React from 'react'
import styles from '@/app/ui/dashboard/approve/approve.module.css';
 import { fetchSale } from '@/app/lib/data';
import {updateSale } from '@/app/lib/actions';

const SingleSalesPage = async ({params}) => {
  const {id} = params;
  const sale = await fetchSale(id);
  return (
    <div className={styles.container}>
        <div className={styles.formContainer}>
            <form action={updateSale} className={styles.form}>
            <input type='hidden' name='id' value={sale.id}/>
            <div className={styles.inputContainer}>
                <label  className={styles.label}>
                Name:
                </label>
            <input className={styles.input} type='text' name='name' placeholder={sale.name}/>
            </div>
            <div className={styles.inputContainer}>
                <label  className={styles.label}>
                 Phone:
                </label>
            <input className={styles.input} type='text' name='phone' placeholder={sale.phone} />
            </div>
            <div className={styles.inputContainer}>
                <label  className={styles.label}>
                Contact Name:
                </label>
            <input className={styles.input} type='text' name='contactName' placeholder={sale.contactName} />
            </div>
            <div className={styles.inputContainer}>
                <label  className={styles.label}>
                Contact Mobile:
                </label>
            <input className={styles.input} type='text' name='contactMobile' placeholder={sale.contactMobile} />
            </div>
            <div className={styles.inputContainer}>
                <label  className={styles.label}>
                Email:
                </label>
            <input className={styles.input} type='email' name='email' placeholder={sale.email} />
            </div>
            <div className={styles.inputContainer}>
                <label  className={styles.label}>
                Address:
                </label>
            <textarea className={styles.input} type='text' name='address' placeholder={sale.address} />
            </div>
            <button className={styles.button}>Update</button>
            </form>
        </div>
    </div>
  );
};

export default SingleSalesPage