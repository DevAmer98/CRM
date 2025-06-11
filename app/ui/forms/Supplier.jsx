'use client'
import { addSupplier } from '@/app/lib/actions'
import styles from '@/app/ui/dashboard/approve/approve.module.css';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast';
import { z } from 'zod';




const supplierSchema = z.object({
    name: z.string()
      .min(3, 'Name must be at least 3 characters long.')
      .max(20, 'Name must not exceed 20 characters long.'),
    phone: z.string()
      .min(1, 'Phone is required.'),
    contactName: z.string()
      .min(1, 'Contact Name is required.'),
    contactMobile: z.string()
      .min(1, 'Contact Mobile is required.'),
    email: z.string()
      .email('Invalid email format.') 
      .min(1, 'Email is required.'),
    address: z.string()
      .min(1, 'Address is required.')
  });


const AddSupplierForm = () => {
    const [isSupplier, setIsSupplier] = useState(false); 
    const router = useRouter();
  
    useEffect(() => {
        setIsSupplier(typeof window !== 'undefined');
    }, []);
  
  
      
  const supplierActions = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const formObj = Object.fromEntries(formData.entries());
  
    if (isSupplier) {
      try {
        const validatedData = supplierSchema.parse(formObj);
        const result = await addSupplier(validatedData);
        if (result.success) {
          toast.success('Supplier added successfully!');
          router.push('/dashboard/suppliers');
        } else {
          // Handle errors from backend here
          toast.error(result.message);
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.errors.forEach((err) => {
            toast.error(err.message);
          });
        } else {
          // This will catch other unexpected errors
          toast.error("An unexpected error occurred.");
        }
      }
    }
  };



  return (
    <div>
         <form onSubmit={supplierActions} className={styles.form}>
        <div className={styles.inputContainer}>
                <label  className={styles.label}>
                Supplier Name:
                </label>
        <input className={styles.input} type="text"  name="name" required /> 
        </div>
        <div className={styles.inputContainer}>
                <label  className={styles.label}>
                Supplier Phone:
                </label>
        <input className={styles.input}  type="phone"  name="phone" required />
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
        <input className={styles.input} type="email" name="email" />
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

export default AddSupplierForm