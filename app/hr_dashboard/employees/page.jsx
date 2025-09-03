import React from 'react'
import styles from '@/app/ui/dashboard/clients/clients.module.css';
import Search from '@/app/ui/hr_dashboard/search/search';
import Link from 'next/link';
import Pagination from '@/app/ui/dashboard/pagination/pagination';
import { fetchEmployees } from '@/app/lib/data';
import DeleteEmployee from '@/app/ui/deleteForms/Employee';

const EmployeesPage = async ({searchParams}) => {
   const q = searchParams?.q || "";
  const page = searchParams?.page || 1;
  const {count , employees} = await fetchEmployees(q, page);
  
  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <Search placeholder="Search for a Employee..." />
        <Link href='/hr_dashboard/employees/add'>
          <button className={styles.addButton}>Add New</button>        
        </Link>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <td>Employee No.</td>
              <td>Employee Name</td>
              <td>Employee Phone</td>
              <td>Email Address</td>
              <td>Created At</td>
              <td>Action</td>

            </tr>
          </thead>
          <tbody>
            {employees.map((employee) =>(
            <tr key={employee.id}>
              <td>{employee.employeeNo}</td>
              <td>{employee.name}</td>
              <td>{employee.contactMobile}</td>
              <td>{employee.email}</td>
              <td>{employee.createdAt?.toString().slice(4,16)}</td>
              <td>
              <div className={styles.buttons}>
                <Link href={`/hr_dashboard/employees/${employee.id}`} >
                  <button className={`${styles.button} ${styles.view}`}>View</button>
                  </Link>
<DeleteEmployee employeeId={employee._id.toString()} employeeNmae={employee.name} />
                  </div>
              </td>
            </tr>
            ))}
          </tbody>
        </table>
      <Pagination count={count} />
    </div>
    
  );
};

export default EmployeesPage




 


