"use client";
import React, { useState } from 'react';
import styles from '@/app/ui/dashboard/clients/clients.module.css';
import Search from '@/app/ui/dashboard/search/search';
import Link from 'next/link';
import DeleteSupplier from '../../deleteForms/Supplier';
import Pagination from '../pagination/pagination';
import { FaEye } from 'react-icons/fa';
import { Eye, EyeClosedIcon } from 'lucide-react';

const ShowSuppliers = ({ suppliers, count }) => {
  const [expandedSupplierId, setExpandedSupplierId] = useState(null);
  const [dialog, setDialog] = useState({
  isOpen: false,
  type: '', // "paid", "unpaid", "partial"
  purchaseOrderId: null,
});
const [partialAmount, setPartialAmount] = useState('');



const initialRemaining = suppliers.reduce((acc, supplier) => {
  supplier.purchaseOrders.forEach(po => {
  

    acc[po._id] =
  po.remainingAmount != null
    ? Number(po.remainingAmount)
    : Number(po.totalPrice);



    

  });
  return acc;
}, {});



const [remainingAmounts, setRemainingAmounts] = useState(initialRemaining);






const currentPO = suppliers
  .flatMap((supplier) => supplier.purchaseOrders || [])
  .find((po) => po._id === dialog.purchaseOrderId);



const openDialog = (poId, type) => {
  setDialog({ isOpen: true, type, purchaseOrderId: poId });
  setPartialAmount(''); // reset partial amount on each open
};
const handleConfirm = async () => {
  if (dialog.type === "partial" && !partialAmount) {
    alert("Please enter the amount paid for partial payment.");
    return;
  }

  const currentSupplier = suppliers.find((supplier) =>
    supplier.purchaseOrders.some((po) => po._id === dialog.purchaseOrderId)
  );

  if (!currentSupplier) {
    console.error("Supplier not found");
    return;
  }

  const paidPO = currentSupplier.purchaseOrders.find(po => po._id === dialog.purchaseOrderId);
  if (!paidPO) {
    console.error("Purchase order not found");
    return;
  }

  let newRemaining = remainingAmounts[paidPO._id] ?? Number(paidPO.totalPrice);

  if (dialog.type === "paid") {
    newRemaining = 0;
  } else if (dialog.type === "partial") {
    newRemaining -= Number(partialAmount);
  }

  newRemaining = Math.max(newRemaining, 0);

  setRemainingAmounts(prev => ({
    ...prev,
    [paidPO._id]: newRemaining,
  }));

  console.log("Updating PO:", dialog.purchaseOrderId, "Status:", dialog.type, "Amount:", partialAmount);

  try {
    const res = await fetch(`/api/purchaseOrder/${dialog.purchaseOrderId}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        newRemaining,
        status: dialog.type,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Failed to update purchase order:", errorText);
      alert("Failed to update the database. Please try again.");
    }
  } catch (error) {
    console.error("Failed to update purchase order:", error);
    alert("An error occurred while updating the database.");
  }

  setDialog({ isOpen: false, type: '', purchaseOrderId: null });
};

const handleCancel = () => {
  setDialog({ isOpen: false, type: '', purchaseOrderId: null });
};


  const toggleOrders = (supplierId) => {
    setExpandedSupplierId(prev => prev === supplierId ? null : supplierId);
  };

  

  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <Search placeholder="Search for a supplier..." />
        <Link href='/dashboard/suppliers/add'>
          <button className={styles.addButton}>Add New</button>        
        </Link>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <td>Supplier ID</td>
            <td>Supplier Name</td>
            <td>Supplier Phone</td>
            <td>Email Address</td>
            <td>Total</td>
            <td>Remaining </td>

            <td>Action</td>
          </tr>
        </thead>
        <tbody>
        {suppliers.map((supplier) => {
  const totalAmount = supplier.purchaseOrders.reduce(
    (sum, po) => sum + (Number(po.totalPrice) || 0),
    0
  );

  return (
    <React.Fragment key={supplier._id}>
      <tr>
        <td>{supplier.supplierId}</td>
        <td>{supplier.name}</td>
        <td>{supplier.phone}</td>
        <td>{supplier.email}</td>
        <td>{totalAmount.toFixed(2)}</td>  {/* ✅ Show computed total */}
<td>{supplier.purchaseOrders.reduce(
  (sum, po) => sum + (
    remainingAmounts[po._id] ??
    po.remainingAmount ??
    po.totalPrice
  ),
  0
).toFixed(2)}</td>

<td>
     <div className={styles.buttons}>
  <button
    className={`${styles.button} ${styles.view}`}
    onClick={() => toggleOrders(supplier._id)}
  >
    {expandedSupplierId === supplier._id ? "Hide Orders" : "Show Orders"}
  </button>
  <DeleteSupplier supplierId={supplier._id} supplierName={supplier.name} />
  <Link href={`/dashboard/suppliers/${supplier._id}`}>
    <button className={styles.eyeButton} title="View Supplier Details">
      <Eye />
    </button>
  </Link>
</div>
</td>


      </tr>

      {expandedSupplierId === supplier._id && supplier.purchaseOrders.length > 0 && (
        <tr>
          <td colSpan="8" className={styles.purchaseOrdersCell}>
            <table className={styles.innerTable}>
              <thead>
                <tr>
                  <td>Purchase ID</td>
                  <td>Job Order</td>
                  <td>Delivery Location</td>
                  <td>Payment Term</td>
                  <td>Total</td>
                  <td>Remaining</td>
                  <td>Created At</td>
                  <td>Status</td>
                </tr>
              </thead>
              <tbody>
                {supplier.purchaseOrders.map((po) => (
                  <tr key={po._id}>
                    <td>{po.purchaseId}</td>
                    <td>{po.jobOrder?.jobOrderId || "N/A"}</td>
                    <td>{po.deliveryLocation}</td>
                    <td>{po.paymentTerm}</td>
                    <td>{po.totalPrice}</td>
                    <td>{(
                          remainingAmounts[po._id] ??
                            po.remainingAmount ??
                            po.totalPrice
                        ).toFixed(2)}</td>                   
                    <td>{new Date(po.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className={styles.paymentButtons}>
                        <button className={`${styles.button} ${styles.paid}`} onClick={() => openDialog(po._id, "paid")}>Paid</button>
                        <button className={`${styles.button} ${styles.partial}`} onClick={() => openDialog(po._id, "partial")}>Partial</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
})}

        </tbody>
      </table>
      <Pagination count={count} />

{dialog.isOpen && (
  <div className={styles.dialogOverlay}>
    <div className={styles.dialog}>
      {currentPO && (
        <p className={styles.poInfo}>
          Purchase Order: <strong>{currentPO.purchaseId}</strong>
        </p>
      )}
      {dialog.type === "partial" ? (
        <>
          <h3>Partial Payment</h3>
          <p>Enter amount paid:</p>
          <input
            type="number"
            className={styles.partialInput}
            value={partialAmount}
            onChange={(e) => setPartialAmount(e.target.value)}
          />
        </>
      ) : (
        <p>Are you sure you want to mark this purchase order as <strong>{dialog.type.toUpperCase()}</strong>?</p>
      )}

      <div className={styles.dialogButtons}>
        <button onClick={handleConfirm} className={styles.confirm}>Confirm</button>
        <button onClick={handleCancel} className={styles.cancel}>Cancel</button>
      </div>
    </div>
  </div>
)}

      
    </div>
    
  );
};

export default ShowSuppliers;
