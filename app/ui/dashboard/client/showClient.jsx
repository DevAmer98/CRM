"use client";
import React, { useState } from 'react'
import styles from '@/app/ui/dashboard/clients/clients.module.css';
import Search from '@/app/ui/dashboard/search/search';
import Link from 'next/link';
import Pagination from '@/app/ui/dashboard/pagination/pagination';
import DeleteClient from '@/app/ui/deleteForms/Client';
import { Eye } from 'lucide-react';


const ShowClients = ({ clients, count }) => {
  const [expandedClientId, setExpandedClientId] = useState(null);
  const [dialog, setDialog] = useState({
  isOpen: false,
  type: '', // "paid", "unpaid", "partial"
  quotationId: null,
});
const [partialAmount, setPartialAmount] = useState('');




const initialRemaining = clients.reduce((acc, client) => {
  client.quotations.forEach(quotation => {
  

    acc[quotation._id] =
  quotation.remainingAmount != null
    ? Number(quotation.remainingAmount)
    : Number(quotation.totalPrice);



    

  });
  return acc;
}, {});






const [remainingAmounts, setRemainingAmounts] = useState(initialRemaining);



const currentQuotation = clients
  .flatMap((client) => client.quotations || [])
  .find((quotation) => quotation._id === dialog.quotationId);



const openDialog = (quoId, type) => {
  setDialog({ isOpen: true, type, quotationId: quoId });
  setPartialAmount(''); // reset partial amount on each open
};
const handleConfirm = async () => {
  if (dialog.type === "partial" && !partialAmount) {
    alert("Please enter the amount paid for partial payment.");
    return;
  }
 
  const currentClient = clients.find((client) =>
    client.quotations.some((quotation) => quotation._id === dialog.quotationId)
  );

  if (!currentClient) {
    console.error("Client not found");
    return;
  }

  const paidQuo = currentClient.quotations.find(quotation => quotation._id === dialog.quotationId);
  if (!paidQuo) {
    console.error("Quotation not found");
    return;
  }

  let newRemaining = remainingAmounts[paidQuo._id] ?? Number(paidQuo.totalPrice);

  if (dialog.type === "paid") {
    newRemaining = 0;
  } else if (dialog.type === "partial") {
    newRemaining -= Number(partialAmount);
  }

  newRemaining = Math.max(newRemaining, 0);

  setRemainingAmounts(prev => ({
    ...prev,
    [paidQuo._id]: newRemaining,
  }));

  console.log("Updating Quo:", dialog.quotationId, "Status:", dialog.type, "Amount:", partialAmount);

  try {
    const res = await fetch(`/api/quotation/${dialog.quotationId}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        newRemaining,
        status: dialog.type,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Failed to update Quotation:", errorText);
      alert("Failed to update the database. Please try again.");
    }
  } catch (error) {
    console.error("Failed to update Quotation:", error);
    alert("An error occurred while updating the database.");
  }

  setDialog({ isOpen: false, type: '', quotationId: null });
};

const handleCancel = () => {
  setDialog({ isOpen: false, type: '', quotationId: null });
};


  const toggleQuotations = (clientId) => {
    setExpandedClientId(prev => prev === clientId ? null : clientId);
  };

  

  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <Search placeholder="Search for a client..." />
        <Link href='/dashboard/clients/add'>
          <button className={styles.addButton}>Add New</button>        
        </Link>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <td>Client Name</td>
            <td>Client Phone</td>
            <td>Total</td>
            <td>Remaining </td>
            <td>Action</td>
          </tr>
        </thead>
        <tbody>
        {clients.map((client) => {
  const totalAmount = client.quotations.reduce(
    (sum, quotation) => sum + (Number(quotation.totalPrice) || 0),
    0
  );

  return (
    <React.Fragment key={client._id}>
      <tr>
        <td>{client.name}</td>
        <td>{client.phone}</td>
        <td>{totalAmount.toFixed(2)}</td> 
<td>{client.quotations.reduce(
  (sum, quotation) => sum + (
    remainingAmounts[quotation._id] ??
    quotation.remainingAmount ??
    quotation.totalPrice
  ),
  0
).toFixed(2)}</td>

<td>
     <div className={styles.buttons}>
  <button
    className={`${styles.button} ${styles.view}`}
    onClick={() => toggleQuotations(client._id)}
  >
    {expandedClientId === client._id ? "Hide Quotations" : "Show Quotations"}
  </button>
  <DeleteClient clientId={client._id} clientName={client.name} />
  <Link href={`/dashboard/clients/${client._id}`}>
    <button className={styles.eyeButton} title="View Client Details">
      <Eye />
    </button>
  </Link>
</div>
</td>


      </tr>

      {expandedClientId === client._id && client.quotations.length > 0 && (
        <tr>
          <td colSpan="8" className={styles.purchaseOrdersCell}>
            <table className={styles.innerTable}>
              <thead>
                <tr>
                  <td>Quotation ID</td>
                  <td>Sales Representative</td>
                  <td>Payment Term</td>
                  <td>Total</td>
                  <td>Remaining</td>
                  <td>Created At</td>
                  <td>Status</td>
                </tr>
              </thead> 
              <tbody>
                {client.quotations.map((quotation) => (
                  <tr key={quotation._id}>
                    <td>{quotation.quotationId}</td>
<td>{quotation.sale?.name || 'N/A'}</td>
                    <td>{quotation.paymentTerm}</td>
                    <td>{quotation.totalPrice}</td>
                    <td>{(
                          remainingAmounts[quotation._id] ??
                            quotation.remainingAmount ??
                            quotation.totalPrice
                        ).toFixed(2)}</td>                   
                    <td>{new Date(quotation.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className={styles.paymentButtons}>
                        <button className={`${styles.button} ${styles.paid}`} onClick={() => openDialog(quotation._id, "paid")}>Paid</button>
                        <button className={`${styles.button} ${styles.partial}`} onClick={() => openDialog(quotation._id, "partial")}>Partial</button>
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
      {currentQuotation && (
        <p className={styles.poInfo}>
          Quotation: <strong>{currentQuotation.quotationId}</strong>
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
        <p>Are you sure you want to mark this Quotation as <strong>{dialog.type.toUpperCase()}</strong>?</p>
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

export default ShowClients;
