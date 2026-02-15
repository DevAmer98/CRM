import React from "react";
import { fetchPurchaseOrders } from "@/app/lib/data";
import PurchaseInvoices from "@/app/ui/dashboard/finance/PurchaseInvoices";

const PurchaseInvoicesPage = async ({ searchParams }) => {
  const q = searchParams?.q || "";
  const page = Number(searchParams?.page) || 1;

  const { purchaseOrders, count } = await fetchPurchaseOrders(q, page);

  return <PurchaseInvoices purchaseOrders={purchaseOrders} count={count} />;
};

export default PurchaseInvoicesPage;
