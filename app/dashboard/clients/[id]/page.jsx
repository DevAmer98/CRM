import React from 'react'
import styles from '@/app/ui/dashboard/approve/approve.module.css';
 import { fetchClient } from '@/app/lib/data';
import { updateClient } from '@/app/lib/actions';

const SingleClientsPage = async ({params}) => {
  const {id} = params;
  const client = await fetchClient(id);
  return (
    <div className={styles.container}>
        <div className={styles.formContainer}>
            <form action={updateClient} className={styles.form}>
            <input type='hidden' name='id' value={client.id}/>
            <div className={styles.inputContainer}>
                <label  className={styles.label}>
                Name:
                </label>
            <input className={styles.input} type='text' name='name' placeholder={client.name}/>
            </div>
            <div className={styles.inputContainer}>
                <label  className={styles.label}>
                Phone:
                </label>
            <input className={styles.input} type='text' name='phone' placeholder={client.phone} />
            </div>
            <div className={styles.inputContainer}>
                <label  className={styles.label}>
                Contact Name:
                </label>
            <input className={styles.input}  type='text' name='contactName' placeholder={client.contactName} />
            </div>
            <div className={styles.inputContainer}>
                <label  className={styles.label}>
                Contact Mobile:
                </label>
            <input className={styles.input} type='text' name='contactMobile' placeholder={client.contactMobile} />
            </div>
            <div className={styles.inputContainer}>
                <label  className={styles.label}>
                Email:
                </label>
            <input className={styles.input} type='email' name='email' placeholder={client.email} />
            </div>
            <div className={styles.inputContainer}>
                <label  className={styles.label}>
                Address:
                </label>
            <textarea className={styles.input} type='text' name='address' placeholder={client.address} />
            </div>
            <button className={styles.button}>Update</button>
            </form>
        </div>
    </div>
  );
};

export default SingleClientsPage