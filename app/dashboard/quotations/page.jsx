import React from 'react';
import ShowQuotations from '@/app/ui/dashboard/quotations/ShowQuotations';
import { fetchQuotations } from '@/app/lib/data';

const QuotationPage = async ({ searchParams }) => {
  const q = searchParams?.q || '';
  const page = searchParams?.page || 1;

  const { quotations, count } = await fetchQuotations(q, page);

  return <ShowQuotations quotations={quotations} count={count} />;
};

export default QuotationPage;
