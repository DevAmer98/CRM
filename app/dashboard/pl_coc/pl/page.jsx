import React from 'react'
import styles from '@/app/ui/dashboard/clients/clients.module.css';
import Search from '@/app/ui/dashboard/search/search';
import Link from 'next/link';
import Pagination from '@/app/ui/dashboard/pagination/pagination';
import { fetchPls } from '@/app/lib/data';
import DeletePl from '@/app/ui/deleteForms/Pl';

const PlPage = async ({searchParams}) => {
  const q = searchParams?.q || "";
  const page = searchParams?.page || 1;  
  const {count , pls} = await fetchPls(q, page);
  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <Search placeholder="Search for a Project..." />
        <Link href='/dashboard/pl_coc/pl/addPl'>
          <button className={styles.addButton}>Add New</button>        
        </Link>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <td>Client Name</td>
              <td>Pick List Number</td>
              <td>Job Order</td>
              <td>Created At</td>
              <td>Updated At</td>
              <td>Action</td>
            </tr>
          </thead>
          <tbody>
          {pls && pls.map((pl) => (
             <tr key={pl.id}>
              <td>{pl.client?.name || 'No client name'} </td>
              <td>{pl.pickListId || 'No Pick List Number'} </td>
              <td>{pl.jobOrder?.jobOrderId || 'No Job Order'} </td>
              <td>{pl.createdAt?.toString().slice(4,16)}</td>
              <td>{pl.updatedAt?.toString().slice(4,16)}</td>


              <td> 
                <div className={styles.buttons}>
                <Link href={`/dashboard/pl_coc/pl/${pl.id}`}>
                  <button className={`${styles.button} ${styles.view}`}>View</button>
                  </Link>
                    <DeletePl pickListId={pl.pickListId} customPickListIdId={pl.customPickListIdId} />
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

export default PlPage