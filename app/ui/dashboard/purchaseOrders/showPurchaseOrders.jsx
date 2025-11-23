'use client';
import React, { useState } from 'react';
import styles from '@/app/ui/dashboard/quotations/quotations.module.css';
import Search from '@/app/ui/dashboard/search/search';
import * as XLSX from 'xlsx';
import Link from 'next/link';
import Pagination from '@/app/ui/dashboard/pagination/pagination';
import DeletePurchaseOrder from '@/app/ui/deleteForms/PurchaseOrder';
 
const ShowPurchaseOrder = ({ purchaseOrders, count }) => {
  
 const [localPurchaseOrders, setLocalPurchaseOrders] = useState(purchaseOrders);
    const [selectedIds, setSelectedIds] = useState([]);

       const handleExport = () => {
      const selectedPurchaseOrders = localPurchaseOrders.filter(purchaseOrder =>
        selectedIds.includes(purchaseOrder._id)
      );
      exportExcel(selectedPurchaseOrders, 'selected_Purchase_Orders.xlsx');
    };
    
    
      const toggleSelect = (id) => {
        setSelectedIds(prev =>
          prev.includes(id) ? prev.filter(_id => _id !== id) : [...prev, id]
        );
      };
    
      const exportExcel = (rows, filename = 'purchase_Orders.xlsx') => {
        const data = [
          [
            'Client Name',
            'Project Name',
            'Quotation Number',
            'Project Location Address',
            'Created At',
            'Updated At',
          ],
          ...rows.map((purchaseOrder) => [
            purchaseOrder.client?.name || 'No client name',
            purchaseOrder.projectName,
            purchaseOrder.quotationId,
            purchaseOrder.projectLA,
            purchaseOrder.createdAt
              ? new Date(purchaseOrder.createdAt).toLocaleDateString()
              : 'N/A',
            purchaseOrder.updatedAt
              ? new Date(purchaseOrder.updatedAt).toLocaleDateString()
              : 'N/A',
          ]),
        ];
    
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'PurchaseOrders');
        XLSX.writeFile(workbook, filename);
      };
    


  return ( 
    <div className={styles.container}>
      <div className={styles.top}>
        <Search placeholder="Search for a Supplier..." />
                        <div className={styles.topRight}>

        <Link href='/dashboard/purchaseOrder/add'>
          <button className={styles.addButton}>Add New</button>        
        </Link>
        </div>
        </div>
        <div className={styles.exportButtons}>
        <button
          onClick={handleExport}
          className={styles.exportButton}
          disabled={selectedIds.length === 0}
        >
          Export Selected
        </button>
        <button
  onClick={() => exportExcel(localPurchaseOrders, 'all_purchase_orders.xlsx')}
  className={styles.exportButton}
>
  Export All
</button>

      </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <td></td>
              <td>Supplier Name</td>
              <td>Purchase Order Number</td>
              <td>Job Order Number</td>
              <td>Created At</td> 
              <td>Action</td>
            </tr>
          </thead>
          <tbody>
            
            {purchaseOrders.map((purchaseOrder) => (
              
              <tr key={purchaseOrder.id}>
                <td>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(purchaseOrder._id)}
                  onChange={() => toggleSelect(purchaseOrder._id)}
                />
              </td>
              <td>{purchaseOrder.supplier?.name || 'No supplier name'}</td>
              <td>{purchaseOrder.purchaseId || 'No P Number'}</td>
              <td>{purchaseOrder.jobOrder?.jobOrderId || 'No Job Order Number'}</td>
              <td>{purchaseOrder.createdAt?.toString().slice(4,16)}</td>
              <td> 
                <div className={styles.buttons}>
                <Link href={`/dashboard/purchaseOrder/${purchaseOrder.id}`}> 
                  <button className={`${styles.button} ${styles.view}`}>View</button>
                  </Link>
                <DeletePurchaseOrder purchaseId={purchaseOrder.purchaseId} purhcaseCustomId={purchaseOrder.purchaseId}/>

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


export default ShowPurchaseOrder