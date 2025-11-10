//app/ui/dashboard/quotations/showQuotations.jsx
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
    const [isExportingAll, setIsExportingAll] = useState(false);
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

  if (!selectedQuotations.length) {
    alert('Please select at least one quotation to export.');
    return;
  }

  exportExcel(selectedQuotations, 'selected_Quotations.xlsx');
};

  const handleExportAll = async () => {
    try {
      setIsExportingAll(true);
      const params = new URLSearchParams();
      const searchQuery = searchParams.get('q');

      if (searchQuery) {
        params.set('q', searchQuery);
      }
      if (companyFilter) {
        params.set('company', companyFilter);
      }

      const queryString = params.toString();
      const endpoint = queryString ? `/api/allQuotations?${queryString}` : '/api/allQuotations';

      const response = await fetch(endpoint, { cache: 'no-store' });

      if (!response.ok) {
        throw new Error('Failed to fetch quotations for export.');
      }

      const allQuotations = await response.json();
      exportExcel(allQuotations, 'all_quotations.xlsx');
    } catch (error) {
      console.error('Error exporting all quotations:', error);
      alert('Failed to export all quotations. Please try again.');
    } finally {
      setIsExportingAll(false);
    }
  };


  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(_id => _id !== id) : [...prev, id]
    );
  };

  const formatAmount = (value) => {
    if (value === null || value === undefined || value === '') return '';
    const numericValue = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numericValue)) return '';
    return Number.parseFloat(numericValue.toFixed(2));
  };

  const exportExcel = (rows, filename = 'quotations_with_products.xlsx') => {
    if (!rows?.length) {
      alert('There are no quotations to export.');
      return;
    }

  const data = [
    [
      'Quotation ID',
      'Client Name',
      'Client Contact',
      'Client Mobile',
      'Client Email',
      'Client Address',
      'Project Name',
      'Project Location Address',
      'Total Price (Incl. VAT)',
      'Remaining Amount',
      'Payment Status',
      'Currency',
      'Created At',
      'Updated At',
    ],
    ...rows.map((q) => [
      q.quotationId,
      q.client?.name || 'N/A',
      q.client?.contactName || 'N/A',
      q.client?.contactMobile || 'N/A',
      q.client?.email || 'N/A',
      q.client?.address || 'N/A',
      q.projectName || 'N/A',
      q.projectLA || 'N/A',
      formatAmount(q.totalPrice),
      formatAmount(q.remainingAmount),
      q.paymentStatus || 'N/A',
      q.currency || 'N/A',
      q.createdAt ? new Date(q.createdAt).toLocaleDateString() : 'N/A',
      q.updatedAt ? new Date(q.updatedAt).toLocaleDateString() : 'N/A',
    ]),
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
  onClick={async () => {
    if (isExportingAll) return;
    await handleExportAll();
  }}
  className={styles.exportButton}
  disabled={isExportingAll}
>
  {isExportingAll ? 'Exporting...' : 'Export All'}
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
