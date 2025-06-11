import React from 'react';
import styles from '@/app/ui/dashboard/quotations/quotations.module.css';
import Search from '@/app/ui/dashboard/search/search';
import Link   from 'next/link';
import Pagination from '@/app/ui/dashboard/pagination/pagination';
 import { fetchJobOrders } from '@/app/lib/data';
import { deleteJobOrder } from '@/app/lib/actions';

 
const JobOrderPage = async ({searchParams}) => {
  const q = searchParams?.q || "";
  const page = searchParams?.page || 1; 
  const {count , jobOrders} = await fetchJobOrders(q, page);
  return (
    <div className={styles.container}> 
      <div className={styles.top}>
        <Search placeholder="Search for a Project..." />
        <Link href='/dashboard/jobOrder/add'>
          <button className={styles.addButton}>Add New</button>        
        </Link>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <td>Client Name</td>
              <td>Quotation Number</td>
              <td>Job Order</td>
              <td>Project Name</td>
              <td>Created At</td>
              <td>Action</td>
            </tr>
          </thead>
          <tbody>
            {jobOrders.map((job) => ( 
            <tr key={job.id}>
              <td>
                {job.client?.name || 'No client name'} 
              </td>
              <td>{job.quotation?.quotationId}</td>
              <td>{job.jobOrderId}</td>
              <td>{job.quotation?.projectName}</td>
              <td>{job.createdAt?.toString().slice(4,16)}</td>
              <td> 
                <div className={styles.buttons}>
                  <form action={deleteJobOrder}>
                  <input type='hidden' name='id' value={job.id}/>
                  <button className={`${styles.button} ${styles.delete}`}>Delete</button>
                  
                  </form>
                  </div>
              </td>
            </tr>
           ))}
          </tbody>
        </table>
      <Pagination count={count}/>
    </div>
    
  )
}



export default JobOrderPage;

 