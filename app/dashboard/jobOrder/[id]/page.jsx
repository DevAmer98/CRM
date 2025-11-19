import React from 'react';
import { notFound } from 'next/navigation';
import { fetchJobOrderById } from '@/app/lib/data';
import styles from '@/app/ui/dashboard/quotations/quotations.module.css';
import JobOrderDetailsPage from '@/app/ui/dashboard/jobOrder/JobOrderDetailsPage';

const JobOrderDetails = async ({ params }) => {
  const jobOrder = await fetchJobOrderById(params.id);

  if (!jobOrder) {
    notFound();
  }

  const serialized = JSON.parse(JSON.stringify(jobOrder));

  return (
    <div className={styles.detailsPage}>
      <JobOrderDetailsPage initialJobOrder={serialized} />
    </div>
  );
};

export default JobOrderDetails;
