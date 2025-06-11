'use client'
import styles from '@/app/ui/dashboard/employees/addEmployee/addEmployee.module.css';
import React, { useEffect, useState } from 'react'
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import {updateEmployee } from '@/app/lib/actions';

const employeeSchema = z.object({
  id: z.string(),  // Add ID to the schema
  employeeNo: z.string(),	
    name: z.string().optional(),
    contactMobile: z.string().optional(),
    email: z.string().optional(),
    iqamaNo: z.string().optional(),
    iqamaExpirationDate: z.string().optional(),
    passportNo: z.string().optional(),
    passportExpirationDate: z.string().optional(),
    dateOfBirth: z.string(), 
    jobTitle: z.string().optional(),
    directManager: z.string().optional(),
    contractDuration: z.string().optional(),
    contractStartDate: z.string().optional(),
    contractEndDate: z.string().optional(),
    createdAt: z.date().optional(), // Handled automatically by timestamps
    updatedAt: z.date().optional()  // Handled automatically by timestamps
  });


  const EditEmployee = ({ employee }) => {
    const [isEmployee, setIsEmployee] = useState(false);
    const router = useRouter();
    const [managers, setManagers] = useState([]);
    const [loading, setLoading] = useState(true); // Updated to true initially
    const domain = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  
    useEffect(() => {
      setIsEmployee(typeof window !== 'undefined');
      fetchManagers(); // Call fetchManagers on component mount
    }, []);
  
    const fetchManagers = async () => {
      try {
        const response = await fetch(`${domain}/api/allManagers`, {
          cache: 'no-store',
          method: 'GET'
        });
        const data = await response.json();
        console.log('fetchClients: Managers fetched:', data);
        setManagers(data);
        setLoading(false);
      } catch (error) {
        console.error('fetchManagers: Error fetching Managers:', error);
        setLoading(false);
      }
    };
  
    const employeeActions = async (event) => {
      event.preventDefault();
      const formData = new FormData(event.target);
      const formObj = Object.fromEntries(formData.entries());
formObj.id = employee._id;  // Set ID explicitly
    
      // Explicitly extract the `id` from the form
      const id = formData.get('id');
      console.log('Extracted ID from form:', id); // Debugging
    
      
    
      if (isEmployee) {
        try {
          const validatedData = employeeSchema.parse(formObj);
          console.log('Validated Data:', validatedData); // Debugging
          const result = await updateEmployee(validatedData);
          console.log('Update Result:', result); // Debugging
    
          if (result.success) {
            toast.success('Employee updated successfully!');
            router.refresh();
            router.push('/hr_dashboard/employees');
          }
        } catch (error) {
          if (error instanceof z.ZodError) {
            error.errors.forEach((err) => {
              toast.error(err.message);
            });
          } else {
            toast.error(error.message);
          }
        }
      }
    };
    console.log('Employee ID in form:', employee._id); // Debugging
  return (
        <div className={styles.container}>
            <h1 className={styles.pageTitle}>Employee Information</h1>
            <form onSubmit={employeeActions}>
                <div className={styles.formSections}>
                    {/* Left Section */}
                    <div className={styles.formSection}>
                        
                        <div className={styles.formGroup}>
                            {/* Employee Information */}
                            <div className={styles.sectionHeader}>Employee Details</div>
                            <div className={styles.inputRow}>
                                <div className={styles.inputContainer}>
                                    <label className={styles.label}>Employee No:</label>
                            <input className={styles.input} type='text' name='name' placeholder={employee.employeeNo}/>
                                </div>
                                <div className={styles.inputContainer}>
                                    <label className={styles.label}>Employee Name:</label>
                                    <input className={styles.input} type="text" name="name" placeholder={employee.name} />
                                </div>
                            </div>
                            <div className={styles.inputRow}>
                                <div className={styles.inputContainer}>
                                    <label className={styles.label}>Employee Phone:</label>
                                    <input className={styles.input} type="phone" name="contactMobile" placeholder={employee.contactMobile} />
                                </div>
                                <div className={styles.inputContainer}>
                                    <label className={styles.label}>Email Address:</label>
                                    <input className={styles.input} type="email" name="email" placeholder={employee.email} />
                                </div>
                                <div className={styles.inputRow}>
                                <div className={styles.inputContainer}>
                                    <label className={styles.label}>Date of birth:</label>
                                    <input className={styles.input} type="date" name="dateOfBirth" placeholder={employee.dateOfBirth}/>
                                </div>
                            </div>
                            </div>
                        </div>
                        
                        <div className={styles.formGroup}>
                            {/* Iqama Details */}
                            <div className={styles.sectionHeader}>Iqama Details</div>
                            <div className={styles.inputRow}>
                                <div className={styles.inputContainer}>
                                    <label className={styles.label}>ID or Iqama No:</label>
                                    <input className={styles.input} type="text" name="iqamaNo" placeholder={employee.iqamaNo}/>
                                </div>
                                <div className={styles.inputContainer}>
                                    <label className={styles.label}>ID or Iqama expiry date:</label>
                                    <input className={styles.input} type="date" name="iqamaExpirationDate" placeholder={employee.iqamaExpirationDate}/>
                                </div>
                            </div>
                        </div>
                        
                        <div className={styles.formGroup}>
                            {/* Passport Information */}
                            <div className={styles.sectionHeader}>Passport Information</div>
                            <div className={styles.inputRow}>
                                <div className={styles.inputContainer}>
                                    <label className={styles.label}>Passport No:</label>
                                    <input className={styles.input} type="text" name="passportNo" placeholder={employee.passportNo}/>
                                </div>
                                <div className={styles.inputContainer}>
                                    <label className={styles.label}>Passport expiry date:</label>
                                    <input className={styles.input} type="date" name="passportExpirationDate" placeholder={employee.passportExpirationDate}/>
                                </div>
                            </div>
                      
                        </div>
                    </div>
                    
                    {/* Right Section */}
                    <div className={styles.formSection}>
                        
                        <div className={styles.formGroup}>
                            <div className={styles.sectionHeader}>Job Details</div>
                            <div className={styles.inputRow}>
                                <div className={styles.inputContainer}>
                                    <label className={styles.label}>Job title:</label>
                                    <input className={styles.input} type="text" name="jobTitle" placeholder={employee.passportNo} />
                                </div>
                                <div className={styles.inputContainer}>
                                    <label className={styles.label}>Direct manager:</label>
                                    <select name='directManager' className={styles.input} defaultValue="" disabled={loading}>
                                        <option value="" disabled>Select Direct Manager</option>
                                        {managers.length > 0 ? (
                                            managers.map((manager) => (
                                                <option key={manager._id} value={manager._id}>
                                                    {manager.username}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="" disabled>Loading managers...</option>
                                        )}
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <div className={styles.formGroup}>
                            <div className={styles.sectionHeader}>Contract Information</div>
                            <div className={styles.inputRow}>
                                <div className={styles.inputContainer}>
                                    <label className={styles.label}>Contract duration:</label>
                                    <input className={styles.input} type="text" name="contractDuration" placeholder={employee.contractDuration} />
                                </div>
                            </div>
                            <div className={styles.inputRow}>
                                <div className={styles.inputContainer}>
                                    <label className={styles.label}>Contract start date:</label>
                                    <input className={styles.input} type="date" name="contractStartDate" placeholder={employee.contractStartDate}/>
                                </div>
                                <div className={styles.inputContainer}>
                                    <label className={styles.label}>Contract end date:</label>
                                    <input className={styles.input} type="date" name="contractEndDate" placeholder={employee.contractEndDate}/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <button className={styles.button} type="submit">Add Employee</button>
            </form>
        </div>
    );
  
}

export default EditEmployee

