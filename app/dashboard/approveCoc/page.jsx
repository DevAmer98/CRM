import React from 'react'
import styles from '@/app/ui/dashboard/quotations/quotations.module.css';
import Search from '@/app/ui/dashboard/search/search';
import Link from 'next/link';
import Pagination from '@/app/ui/dashboard/pagination/pagination';
import { fetchCocs } from '@/app/lib/data';
import { deleteCoc } from '@/app/lib/actions';



const ApproveCocPage = async ({searchParams}) => {

      const q = searchParams?.q || "";
      const page = searchParams?.page || 1; 
      const {count , cocs} = await fetchCocs(q, page);
      return (
        <div className={styles.container}> 
          <div className={styles.top}>
            <Search placeholder="Search for a Project..." />
            {/*<Link href='/dashboard/pl_coc/coc/addCoc'>
              <button className={styles.addButton}>Add New</button>        
      </Link>*/}
            </div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <td>Client Name</td>
                  <td>Coc Number</td>
                  <td>Job Order</td>
                  <td>Project Name</td>
                  <td>Created At</td>
                  <td>Approved By</td>
                  <td>Action</td>
                </tr>
              </thead>
              <tbody>
              {cocs && cocs.map((coc) => (
                 <tr key={coc.id}>
                  <td>
                    {coc.client?.name || 'No client name'} 
                  </td>
                  <td>{coc.cocId || 'No client name'} </td>
                  <td>{coc.jobOrder?.jobOrderId || 'No client name'} </td>
                  <td>{coc.quotation?.projectName || 'No project name'} </td>
                  <td>{coc.createdAt?.toString().slice(4,16)}</td>
                  <td>
                  {coc.user?.username
                  ? <span className={`${styles.statusBox} ${styles.approved}`}>Approved by {coc.user.username}</span>
                  : <span className={`${styles.statusBox} ${styles.pending}`}>Pending</span>}
                </td>      
                  <td> 
                    <div className={styles.buttons}>
                    <Link href={`/dashboard/approveCoc/${coc.id}`}>
                      <button className={`${styles.button} ${styles.view}`}>View</button>
                      </Link>
                      <form action={deleteCoc}>
                      <input type='hidden' name='id' value={coc.id}/>
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
    


export default ApproveCocPage