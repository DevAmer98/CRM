'use client'
import styles from '@/app/ui/dashboard/employees/addEmployee/addEmployee.module.css';
import React, { useEffect, useState } from 'react'
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import {updateEmployee } from '@/app/lib/actions';
import { useSession } from 'next-auth/react';

const employeeSchema = z.object({
  id: z.string(),  // Add ID to the schema
  employeeNo: z.string().optional(),
    name: z.string().optional(),
    contactMobile: z.string().optional(),
    email: z.string().optional(),
    iqamaNo: z.string().optional(),
    iqamaExpirationDate: z.string().optional(),
    passportNo: z.string().optional(),
    passportExpirationDate: z.string().optional(),
    dateOfBirth: z.string().optional(),
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
    const { data: session } = useSession();
    const userRole = session?.user?.role || 'user'; 


    const [formData, setFormData] = useState({
  employeeNo: employee.employeeNo || '',
  name: employee.name || '',
  contactMobile: employee.contactMobile || '',
  email: employee.email || '',
  iqamaNo: employee.iqamaNo || '',
  iqamaExpirationDate: employee.iqamaExpirationDate ? formatDateToISO(employee.iqamaExpirationDate) : '',
  passportNo: employee.passportNo || '',
  passportExpirationDate: employee.passportExpirationDate ? formatDateToISO(employee.passportExpirationDate) : '',
  dateOfBirth: employee.dateOfBirth ? formatDateToISO(employee.dateOfBirth) : '',
  jobTitle: employee.jobTitle || '',
  directManager: employee.directManager || '',
  contractDuration: employee.contractDuration || '',
  contractStartDate: employee.contractStartDate ? formatDateToISO(employee.contractStartDate) : '',
  contractEndDate: employee.contractEndDate ? formatDateToISO(employee.contractEndDate) : '',
});


const handleInputChange = (field, value) => {
  setFormData(prev => ({
    ...prev,
    [field]: value,
  }));
};

useEffect(() => {
  if (employee && employee._id) {
    setFormData({
      employeeNo: employee.employeeNo || '',
      name: employee.name || '',
      contactMobile: employee.contactMobile || '',
      email: employee.email || '',
      iqamaNo: employee.iqamaNo || '',
      iqamaExpirationDate: employee.iqamaExpirationDate ? formatDateToISO(employee.iqamaExpirationDate) : '',
      passportNo: employee.passportNo || '',
      passportExpirationDate: employee.passportExpirationDate ? formatDateToISO(employee.passportExpirationDate) : '',
      dateOfBirth: employee.dateOfBirth ? formatDateToISO(employee.dateOfBirth) : '',
      jobTitle: employee.jobTitle || '',
      directManager: employee.directManager || '',
      contractDuration: employee.contractDuration || '',
      contractStartDate: employee.contractStartDate ? formatDateToISO(employee.contractStartDate) : '',
      contractEndDate: employee.contractEndDate ? formatDateToISO(employee.contractEndDate) : '',
    });
  }
}, [employee]);



  
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

    function formatDateToISO(dateStr) {
  if (!dateStr) return '';
  const [day, month, year] = dateStr.split('/');
  if (year && month && day) {
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  // fallback: return as-is
  return dateStr;
}

  
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
  toast.success('Employee added successfully!');
  if (userRole === 'admin') {
    router.push('/dashboard/employees');
  } else if (userRole === 'hr_admin') {
    router.push('/hr_dashboard/employees');
  } else {
    router.push('/');
  }
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
<input
  className={styles.input}
  type="date"
  name="dateOfBirth"
    value={formData.dateOfBirth}
      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}


/>
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
                                    <input
  className={styles.input}
  type="date"
  name="iqamaExpirationDate"
  value={formData.iqamaExpirationDate}
        onChange={(e) => handleInputChange('iqamaExpirationDate', e.target.value)}

/>
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
                                     <input
  className={styles.input}
  type="date"
  name="passportExpirationDate"
  value={formData.passportExpirationDate}
        onChange={(e) => handleInputChange('passportExpirationDate', e.target.value)}

/>
                                    
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
                                    <input className={styles.input} type="text" name="jobTitle" placeholder={employee.jobTitle} />
                                </div>
                                <div className={styles.inputContainer}>
                                    <label className={styles.label}>Direct manager:</label>
                                  <select
                                name="directManager"
                                className={styles.input}
                                value={employee.directManager || ""}
                                onChange={(e) => {/* handle if you plan to update local state */}}
                                disabled={loading}
                                >
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
                                    <input
  className={styles.input}
  type="date"
  name="contractStartDate"
  value={formData.contractStartDate}
        onChange={(e) => handleInputChange('contractStartDate', e.target.value)}

/>
                                </div>
                                <div className={styles.inputContainer}>
                                    <label className={styles.label}>Contract end date:</label>
                                    <input
  className={styles.input}
  type="date"
  name="contractEndDate"
  value={formData.contractEndDate}
        onChange={(e) => handleInputChange('contractEndDate', e.target.value)}

/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <button className={styles.button} type="submit">Edit Information</button>
            </form>
        </div>
    );
  
}

export default EditEmployee

