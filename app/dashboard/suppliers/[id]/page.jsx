import React from 'react'
import styles from '@/app/ui/dashboard/approve/approve.module.css';
import {  updateSupplier} from '@/app/lib/actions';
import { fetchSupplier } from '@/app/lib/data';

 
const SingleSupplierPage = async ({params}) => {
  const {id} = params;
  const supplier = await fetchSupplier(id);
  return (
    
    <div className={styles.container}>
      
        <div className={styles.formContainer}>
            <form action={updateSupplier} className={styles.form}>
              
            <input className={styles.input} type='hidden' name='id' value={supplier.id}/>
            <div className={styles.inputContainer}>
                <label  className={styles.label}>
                Supplier Name:
                </label>
            <input className={styles.input} type='text' name='name' placeholder={supplier.name} />
            </div>
            <div className={styles.inputContainer}>
                <label className={styles.label}>
                Phone:
                </label>           
              <input className={styles.input} type='text' name='phone' placeholder={supplier.phone} />
              </div>
              <div className={styles.inputContainer}>
                <label  className={styles.label}>
                Contact Name:
                </label>            
             <input className={styles.input} type='text' name='contactName' placeholder={supplier.contactName} />
             </div>
             <div className={styles.inputContainer}>
                <label  className={styles.label}>
                Contact Mobile:
                </label>
            <input className={styles.input} type='text' name='contactMobile' placeholder={supplier.contactMobile} />
            </div>
            <div className={styles.inputContainer}>
                <label className={styles.label}>
                Email:
                </label>
            <input className={styles.input} type='email' name='email' placeholder={supplier.email} />
            </div>
            <div className={styles.inputContainer}>
                <label className={styles.label}>
                Address:
                </label>
            <textarea className={styles.input} type='text' name='address' placeholder={supplier.address} />
            </div>
            <button className={styles.button}>Update</button>
            </form>
        </div>
    </div>
  );
}

export default SingleSupplierPage