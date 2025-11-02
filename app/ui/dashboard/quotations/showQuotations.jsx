"use client";

import React, { useEffect, useState } from 'react';
import styles from '@/app/ui/dashboard/quotations/quotations.module.css';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import DeleteQuotation from '../../deleteForms/Quotation';
import Search from '@/app/ui/dashboard/search/search';
import Pagination from '@/app/ui/dashboard/pagination/pagination';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const COMPANY_OPTIONS = [
  { value: 'SMART_VISION', label: 'Smart Vision' },
  { value: 'ARABIC_LINE', label: 'ArabicLine' },
];

const ShowQuotations = ({
  quotations,
  count,
  activeCompany = 'SMART_VISION',
  showCompanyToggle = true,
  wrapContainer = true,
}) => {
   const [localQuotations, setLocalQuotations] = useState(quotations);
    const [selectedIds, setSelectedIds] = useState([]);
    const [companyFilter, setCompanyFilter] = useState(activeCompany);
    const searchParams = useSearchParams();
    const { replace } = useRouter();
    const pathname = usePathname();

   useEffect(() => {
     setLocalQuotations(quotations);
     setSelectedIds([]);
   }, [quotations]);

   useEffect(() => {
     setCompanyFilter(activeCompany);
   }, [activeCompany]);

   const handleExport = () => {
  const selectedQuotations = localQuotations.filter(quotation =>
    selectedIds.includes(quotation._id)
  );
  exportExcel(selectedQuotations, 'selected_Quotations.xlsx');
};


  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(_id => _id !== id) : [...prev, id]
    );
  };

  const exportExcel = (rows, filename = 'quotations_with_products.xlsx') => {
  const data = [
    [
      'Quotation ID',
      'Revision No',
      'Client Name',
      'Client Contact',
      'Client Mobile',
      'Client Email',
      'Client Address',
      'Project Name',
      'Project Location Address',
      'Payment Term',
      'Delivery Term',
      'Note',
      'Validity Period',
      'Excluding',
      'Total Price',
      'Remaining Amount',
      'Payment Status',
      'Currency',
      'Created At',
      'Updated At',
      'Product Code',
      'Product Description',
      'Unit',
      'Quantity',
      'Unit Price',
    ],
    ...rows.flatMap((q) =>
      (q.products?.length ? q.products : [{}]).map((product) => [
        q.quotationId,
        q.revisionNumber,
        q.client?.name || 'N/A',
        q.client?.contactName || 'N/A',
        q.client?.contactMobile || 'N/A',
        q.client?.email || 'N/A',
        q.client?.address || 'N/A',
        q.projectName || 'N/A',
        q.projectLA || 'N/A',
        q.paymentTerm || 'N/A',
        q.paymentDelivery || 'N/A',
        q.note || 'N/A',
        q.validityPeriod || 'N/A',
        q.excluding || 'N/A',
        typeof q.totalPrice === 'number' ? q.totalPrice.toFixed(2) : 'N/A',
        typeof q.remainingAmount === 'number'
          ? q.remainingAmount.toFixed(2)
          : 'N/A',
        q.paymentStatus || 'N/A',
        q.currency || 'N/A',
        q.createdAt ? new Date(q.createdAt).toLocaleDateString() : 'N/A',
        q.updatedAt ? new Date(q.updatedAt).toLocaleDateString() : 'N/A',
        product.productCode || '—',
        product.description || '—',
        product.unit || '—',
        product.qty || '—',
        typeof product.unitPrice === 'number'
          ? product.unitPrice.toFixed(2)
          : '—',
      ])
    ),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Quotations');
  XLSX.writeFile(workbook, filename);
};

  const handleCompanyChange = (company) => {
    if (company === companyFilter) return;
    setCompanyFilter(company);
    const params = new URLSearchParams(searchParams);
    params.set('company', company);
    params.set('page', '1');
    replace(`${pathname}?${params.toString()}`);
  };

  const content = (
    <>
      <div className={styles.top}>
        <Search placeholder="Search for a Project..." />
                <div className={styles.topRight}>

        <Link href="/dashboard/quotations/add">
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
  onClick={() => exportExcel(localQuotations, 'all_quotations.xlsx')}
  className={styles.exportButton}
>
  Export All
</button>

      </div>
      {showCompanyToggle && (
        <div className={styles.brandToggle}>
          <span className={styles.brandToggleLabel}>Filter by Company:</span>
          <div className={styles.brandToggleButtons}>
            {COMPANY_OPTIONS.map((option) => {
              const isActive = companyFilter === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`${styles.brandToggleButton} ${isActive ? styles.brandToggleButtonActive : ''}`}
                  onClick={() => handleCompanyChange(option.value)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <table className={styles.table}>
        
         
        <thead>
        
          <tr>
            <td></td>
            <td>Client Name</td>
            <td>Project Name</td>
            <td>Quotation Number</td>
            <td>Project Location Address</td>
            <td>Created At</td>
            <td>Updated At</td> 
            <td>Action</td>
          </tr>
        </thead>
        <tbody>
          {quotations.map((quotation) => (
            <tr key={quotation.id}>
               <td>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(quotation._id)}
                  onChange={() => toggleSelect(quotation._id)}
                />
              </td>
              <td>{quotation.client?.name || 'No client name'}</td>
              <td>{quotation.projectName}</td>
              <td>{quotation.quotationId}</td>
              <td>{quotation.projectLA}</td>
              <td>
                {quotation.createdAt
                  ? new Date(quotation.createdAt).toDateString()
                  : 'N/A'}
              </td>
              <td>
                {quotation.updatedAt
                  ? new Date(quotation.updatedAt).toDateString()
                  : 'N/A'}
              </td>
              <td>
                <div className={styles.buttons}>
<Link href={`/dashboard/quotations/${quotation._id}`}>
                    <button className={`${styles.button} ${styles.view}`}>
                      View
                    </button>
                  </Link>
                  <DeleteQuotation quotationId={quotation.quotationId} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination count={count} />
    </>
  );

  if (wrapContainer) {
    return <div className={styles.container}>{content}</div>;
  }

  return content;
};

export default ShowQuotations;
