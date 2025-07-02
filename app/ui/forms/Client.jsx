'use client'
import styles from '@/app/ui/dashboard/approve/approve.module.css';
import { addClient } from '@/app/lib/actions'
import React, { useEffect, useState } from 'react'
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const clientSchema = z.object({
    name: z.string(),
    phone: z.string()
      .min(1, 'Phone is required.'),
    contactName: z.string()
      .min(1, 'Contact Name is required.'),
    contactMobile: z.string()
      .min(1, 'Contact Mobile is required.'),
    email: z.string()
  .optional(),
    address: z.string()
  .optional(),
  });



const AddClient = () => {
    const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(typeof window !== 'undefined');
  }, []);


      const clientActions = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const formObj = Object.fromEntries(formData.entries());
    
        if (isClient) { 
          try {
            const validatedData = clientSchema.parse(formObj);
            const result = await addClient(validatedData);
            if (result.success) {
              toast.success('Client added successfully!');
              router.push('/dashboard/clients');
            }
          } catch (error) { 
            if (error instanceof z.ZodError) {
              error.errors.forEach((err) => {
                toast.error(err.message);
              });
            } else if (error.message.includes("already exists")) { // Specific check for duplicate key error
              toast.error(error.message);
            } else {
              toast.error(error.message);
            }
          }
        }
      };
    
  return (
    <div className={styles.container}>
    <form onSubmit={clientActions} className={styles.form}>
    <div className={styles.inputContainer}>
            <label  className={styles.label}>
            Client Name:
            </label>
    <input className={styles.input} type="text"  name="name" required />
    </div>
    <div className={styles.inputContainer}>
            <label  className={styles.label}>
            Client Phone:
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
    <input  className={styles.input} type="email"  name="email" />
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

export default AddClient