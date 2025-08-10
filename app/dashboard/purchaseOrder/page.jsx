import React from 'react';
import { fetchPurchaseOrders } from '@/app/lib/data';
import ShowPurchaseOrder from '@/app/ui/dashboard/purchaseOrders/showPurchaseOrders';

const PurchaseOrderPage = async ({ searchParams }) => {
  const q = searchParams?.q || '';
  const page = searchParams?.page || 1;

  const { purchaseOrders, count } = await fetchPurchaseOrders(q, page);

  return <ShowPurchaseOrder purchaseOrders={purchaseOrders} count={count} />;
};

export default PurchaseOrderPage;

 