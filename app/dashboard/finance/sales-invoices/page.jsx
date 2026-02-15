import React from "react";
import { fetchQuotations } from "@/app/lib/data";
import SalesInvoices from "@/app/ui/dashboard/finance/SalesInvoices";

const SalesInvoicesPage = async ({ searchParams }) => {
  const q = searchParams?.q || "";
  const page = Number(searchParams?.page) || 1;
  const companyParam = searchParams?.company || "SMART_VISION";

  const { quotations, count } = await fetchQuotations(q, page, companyParam);

  return <SalesInvoices quotations={quotations} count={count} />;
};

export default SalesInvoicesPage;
