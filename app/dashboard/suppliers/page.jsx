import React from 'react'
import ShowSuppliers from '@/app/ui/dashboard/supplier/showSupplier';
import { fetchSuppliersWithPurchaseOrders } from '@/app/lib/data';

const SupplierPage = async({searchParams}) => {
  const q = searchParams?.q || "";
  const page = searchParams?.page || 1;

   const { suppliers, count } = await fetchSuppliersWithPurchaseOrders(q, page);
    
    return (
      <div>
  <ShowSuppliers suppliers={suppliers} count={count} />
       </div>
      
    );
}

export default SupplierPage