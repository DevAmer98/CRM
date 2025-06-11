import React from 'react'
import styles from '@/app/ui/dashboard/clients/clients.module.css';
import Search from '@/app/ui/dashboard/search/search';
import Link from 'next/link';
import Pagination from '@/app/ui/dashboard/pagination/pagination';
 import { fetchSales } from '@/app/lib/data';
import {deleteSale } from '@/app/lib/actions';
import DeleteSales from '@/app/ui/deleteForms/Sales';

const SalesPage = async ({searchParams}) => {
  const q = searchParams?.q || "";
  const page = searchParams?.page || 1;
  const {count , sales} = await fetchSales(q, page);
  
  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <Search placeholder="Search for a Sales Representative..." />
        <Link href='/dashboard/sales/add'>
          <button className={styles.addButton}>Add New</button>        
        </Link>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <td> Name</td>
              <td> Phone</td>
              <td>Contact Name</td>
              <td>Contact Mobile</td>
              <td>Email Address</td>
              <td>Created At</td>
              <td>Address</td>
              <td>Action</td>

            </tr>
          </thead>
          <tbody>
            {sales.map((sale) =>(
            <tr key={sale.id}>
              <td>{sale.name}</td>
              <td>{sale.phone}</td>
              <td>{sale.contactName}</td>
              <td>{sale.contactMobile}</td>
              <td>{sale.email}</td>
              <td>{sale.createdAt?.toString().slice(4,16)}</td>
              <td>{sale.address}</td>
              <td>
              <div className={styles.buttons}>
                <Link href={`/dashboard/sales/${sale.id}`} >
                  <button className={`${styles.button} ${styles.view}`}>View</button>
                  </Link>
                  <DeleteSales salesId={sale.id.toString()} salesName={sale.name}/>
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

export default SalesPage

