import React from 'react'
import styles from '@/app/ui/dashboard/quotations/quotations.module.css';
import Search from '@/app/ui/dashboard/search/search';
import Link   from 'next/link';
import Pagination from '@/app/ui/dashboard/pagination/pagination';
import {  fetchQuotations } from '@/app/lib/data';
import DeleteQuotation from '@/app/ui/deleteForms/Quotation';


const ApprovePage = async({searchParams}) => {
    const q = searchParams?.q || "";
    const page = searchParams?.page || 1; 
    const {count , quotations} = await fetchQuotations(q, page);
    return (
      <div className={styles.container}> 
        <div className={styles.top}>
          <Search placeholder="Search for a Project..." /> 
          {/*<Link href='/dashboard/approves/add'>
            <button className={styles.addButton}>Add New</button>        
    </Link>*/}
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <td>Client Name</td>
                <td>Project Location Address</td>
                <td>Quotation Number</td>
                <td>Created At</td>
                <td>Approved By</td>
                <td>Action</td>

              </tr>
            </thead>
            <tbody>
              {quotations.map((quotation) => ( 
                
              <tr key={quotation.id}>
                <td>
                  {quotation.client?.name || 'No client name'} 
                </td>
                <td>{quotation.projectName}</td>
                <td>{quotation.quotationId}</td>
                <td>{quotation.createdAt?.toString().slice(4,16)}</td>
                <td>
                  {quotation.user?.username
                  ? <span className={`${styles.statusBox} ${styles.approved}`}>Approved by {quotation.user.username}</span>
                  : <span className={`${styles.statusBox} ${styles.pending}`}>Pending</span>}
                </td>  
  
                <td>  
                  <div className={styles.buttons}>
                  <Link href={`/dashboard/approves/${quotation._id}`}>
                    <button className={`${styles.button} ${styles.view}`}>View</button>
                    </Link>
                    <DeleteQuotation quotationId={quotation.quotationId} />
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

export default ApprovePage