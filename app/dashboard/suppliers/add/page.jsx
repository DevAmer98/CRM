import React from 'react'
import styles from '@/app/ui/dashboard/approve/approve.module.css';
import { addSupplier } from '@/app/lib/actions';
import AddSupplierForm from '@/app/ui/forms/Supplier';

 
const AddSupplier = () => {
  return (
    <div className={styles.container}>
       <AddSupplierForm />
    </div>
  )
}

export default AddSupplier