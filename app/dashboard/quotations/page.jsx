import React from 'react';
import Link from 'next/link';
import ShowQuotations from '@/app/ui/dashboard/quotations/showQuotations';
import { fetchQuotations } from '@/app/lib/data';
import styles from '@/app/ui/dashboard/quotations/quotations.module.css';

const COMPANY_OPTIONS = [
  { value: 'SMART_VISION', label: 'Smart Vision' },
  { value: 'ARABIC_LINE', label: 'Arabic Line' },
];

const buildHref = (params, companyValue) => {
  const nextParams = new URLSearchParams();
  if (params.q) nextParams.set('q', params.q);
  nextParams.set('company', companyValue);
  nextParams.set('page', '1');
  return `/dashboard/quotations?${nextParams.toString()}`;
};

const CompanyPicker = ({ params }) => (
  <div className={styles.companyPicker}>
    <div className={styles.companyPickerInner}>
      <h1 className={styles.companyPickerTitle}>Select a company to view quotations</h1>
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

const QuotationPage = async ({ searchParams }) => {
  const q = searchParams?.q || '';
  const page = Number(searchParams?.page) || 1;
  const companyParam = searchParams?.company;
  const isValidCompany = COMPANY_OPTIONS.some((opt) => opt.value === companyParam);

  if (!isValidCompany) {
    return <CompanyPicker params={{ q }} />;
  }

  const { quotations, count } = await fetchQuotations(q, page, companyParam);

  return (
    <div className={styles.container}>
      <div className={styles.companySwitcher}>
        <span className={styles.companySwitcherLabel}>Switch Company:</span>
        <div className={styles.companyButtonGroup}>
          {COMPANY_OPTIONS.map(({ value, label }) => {
            const isActive = companyParam === value;
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

      <ShowQuotations
        quotations={quotations}
        count={count}
        activeCompany={companyParam}
        showCompanyToggle={false}
        wrapContainer={false}
      />
    </div>
  );
};

export default QuotationPage;
