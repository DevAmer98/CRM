import React from 'react'
import styles from '@/app/ui/dashboard/approve/approve.module.css';
import AddClient from '@/app/ui/forms/Client';

const AddClientPage = () => {
  return (
    <div className={styles.container}>
        <AddClient />
    </div>
  )
}

export default AddClientPage