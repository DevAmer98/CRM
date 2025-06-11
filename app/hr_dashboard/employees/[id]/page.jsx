import { fetchEmployee } from '@/app/lib/data';
import EditEmployee from '@/app/ui/forms/employees/Edit'
import styles from '@/app/ui/dashboard/employees/addEmployee/addEmployee.module.css';
import React from 'react'

const SingleEmployeepage = async ({ params })  => {
  const { id } = params;
  try {
    const employeeDocument = await fetchEmployee(id);
    const employee = JSON.parse(JSON.stringify(employeeDocument.toObject())); 

    console.log('Fetched Employee:', employee);

    return (
      <div className={styles.container}>
        <EditEmployee employee={{ ...employee, id: employee._id }} />
        
      </div>
    );
  } catch (err) {
    console.error('Error in SingleEmployeePage:', err);
    console.log('Employee ID:', employee._id); // Debugging
console.log('Form Data:', formObj); // Debugging

    return <div>Error loading employee data.</div>;
  }
}

export default SingleEmployeepage