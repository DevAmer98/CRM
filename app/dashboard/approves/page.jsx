import React from 'react'
import styles from '@/app/ui/dashboard/quotations/quotations.module.css';
import Search from '@/app/ui/dashboard/search/search';
import Link   from 'next/link';
import Pagination from '@/app/ui/dashboard/pagination/pagination';
import {  fetchQuotations } from '@/app/lib/data';
import DeleteQuotation from '@/app/ui/deleteForms/Quotation';

const COMPANY_OPTIONS = [
  { value: 'SMART_VISION', label: 'Smart Vision' },
  { value: 'ARABIC_LINE', label: 'Arabic Line' },
];

const buildHref = (params, companyValue) => {
  const nextParams = new URLSearchParams();
  if (params.q) nextParams.set('q', params.q);
  nextParams.set('company', companyValue);
  nextParams.set('page', '1');
  return `/dashboard/approves?${nextParams.toString()}`;
};

const CompanyPicker = ({ params }) => (
  <div className={styles.companyPicker}>
    <div className={styles.companyPickerInner}>
      <h1 className={styles.companyPickerTitle}>Select a company to view approvals</h1>
      <div className={styles.companyButtonGroup}>
        {COMPANY_OPTIONS.map(({ value, label }) => (
          <Link key={value} href={buildHref(params, value)} className={styles.companyButton}>
            {label}
          </Link>
        ))}
      </div>
    </div>
  </div>
);


const ApprovePage = async({searchParams}) => {
    const formatDate = (value) => {
      if (!value) return '—';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return '—';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      });
    };

    const displayText = (value) => {
      const text = typeof value === 'string' ? value.trim() : value;
      return text ? text : '—';
    };

    const q = searchParams?.q || "";
    const page = Number(searchParams?.page) || 1;
    const company = searchParams?.company;
    const isValidCompany = COMPANY_OPTIONS.some((option) => option.value === company);

    if (!isValidCompany) {
      return <CompanyPicker params={{ q }} />;
    }

    const {count , quotations} = await fetchQuotations(q, page, company);
    return (
      <div className={styles.container}> 
        <div className={styles.companySwitcher}>
          <span className={styles.companySwitcherLabel}>Switch Company:</span>
          <div className={styles.companyButtonGroup}>
            {COMPANY_OPTIONS.map(({ value, label }) => {
              const isActive = company === value;
              return (
                <Link
                  key={value}
                  href={buildHref({ q }, value)}
                  className={`${styles.companyButton} ${isActive ? styles.companyButtonActive : ''}`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
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
                
              <tr key={quotation._id || quotation.id}>
                <td className={styles.truncateCell}>
                  <span
                    className={styles.truncateText}
                    title={displayText(quotation.client?.name)}
                  >
                    {displayText(quotation.client?.name)}
                  </span>
                </td>
                <td className={styles.truncateCell}>
                  <span
                    className={styles.truncateText}
                    title={displayText(quotation.projectLA || quotation.projectName)}
                  >
                    {displayText(quotation.projectLA || quotation.projectName)}
                  </span>
                </td>
                <td>{displayText(quotation.quotationId)}</td>
                <td>{formatDate(quotation.createdAt)}</td>
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
