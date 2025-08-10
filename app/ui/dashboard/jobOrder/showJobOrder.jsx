"use client";
import React, { useState, useEffect } from 'react';
import styles from '@/app/ui/dashboard/quotations/quotations.module.css';
import Search from '@/app/ui/dashboard/search/search';
import Link from 'next/link';
import Pagination from '@/app/ui/dashboard/pagination/pagination';
import { deleteJobOrder } from '@/app/lib/actions';
import * as XLSX from 'xlsx';

const ShowJobOrders = ({ jobOrders, count }) => {
  const [localJobOrders, setLocalJobOrders] = useState(jobOrders);
  const [selectedIds, setSelectedIds] = useState([]);

  const [dialog, setDialog] = useState({
    isOpen: false,
    type: '', // "paid", "partial"
    jobOrderId: null,
  });
  const [partialAmount, setPartialAmount] = useState('');

  const initialRemaining = jobOrders.reduce((acc, job) => {
    acc[job._id] = job.remainingAmount ?? job.value;
    return acc;
  }, {});
  const [remainingAmounts, setRemainingAmounts] = useState(initialRemaining);

  const currentJobOrder = localJobOrders.find(j => j._id === dialog.jobOrderId);

  useEffect(() => {
    setLocalJobOrders(jobOrders);
  }, [jobOrders]);

  const openDialog = (jobOrderId, type) => {
    setDialog({ isOpen: true, type, jobOrderId });
    setPartialAmount('');
  };
const handleConfirm = async () => {
  if (dialog.type === "partial" && !partialAmount) {
    alert("Please enter a partial amount");
    return;
  }

  const job = localJobOrders.find(j => j._id === dialog.jobOrderId);
  if (!job) return;

  let newRemaining = remainingAmounts[job._id] ?? job.value;
  if (dialog.type === "paid") {
    newRemaining = 0;
  } else if (dialog.type === "partial") {
    newRemaining -= Number(partialAmount);
    newRemaining = Math.max(newRemaining, 0);
  }

  const newPaidAmount = job.value - newRemaining;

  setRemainingAmounts(prev => ({
    ...prev,
    [job._id]: newRemaining
  }));

  try {
    const res = await fetch(`/api/jobOrder/${job._id}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newRemaining, status: dialog.type }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Error:", errorText);
      alert("Failed to update.");
    } else {
      // ✅ Update local state with paid + remaining
      setLocalJobOrders(prev =>
        prev.map(j =>
          j._id === job._id
            ? {
                ...j,
                remainingAmount: newRemaining,
                paidAmount: newPaidAmount
              }
            : j
        )
      );
    }
  } catch (err) {
    console.error("Request error:", err);
    alert("Server error.");
  }

  setDialog({ isOpen: false, type: '', jobOrderId: null });
};

  const handleCancel = () => {
    setDialog({ isOpen: false, type: '', jobOrderId: null });
  };



  const updateJobField = async (id, field, value) => {
  const job = localJobOrders.find(j => j._id === id);
  const updatedJob = {
    ...job,
    [field]: value,
    ...(field === 'projectType' ? { projectStatus: 'OPEN' } : {}),
  };

  try {
    await fetch(`/api/jobOrder/${id}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectType: updatedJob.projectType,
        projectStatus: updatedJob.projectStatus,
      }),
    });

    setLocalJobOrders(prev =>
      prev.map(j => (j._id === id ? updatedJob : j))
    );
  } catch (err) {
    console.error('Error updating job order field:', err);
    alert('Failed to update project field');
  }
};


const exportExcel = (rows, filename = 'job_orders.xlsx') => {
  const data = [
    [
      'Company Name',
      'Project Name',
      'Job Order No',
      'Job Order Date',
      'PO No',
      'PO Date',
      'PO Total without VAT',
      'PO Total with VAT',
      'Paid Amount',
      'Balance',
      'Payment Terms',
      'Delivery Terms',
      'Project Type',
      'Requested By',
      'Project Status'
    ],
    ...rows.map(job => {
      const isSAR = job.currency === 'SAR';
      const valueWithoutVAT = isSAR ? job.baseValue : job.value;
      const valueWithVAT = isSAR ? job.value : job.value;

        const paidAmount = typeof job.paidAmount === 'number'
    ? job.paidAmount.toFixed(2)
    : '0.00';

  const balance = typeof job.remainingAmount === 'number'
    ? job.remainingAmount.toFixed(2)
    : '0.00';

      

      return [
        job.client?.name || 'N/A',
        job.quotation?.projectName || 'N/A',
        job.jobOrderId || 'N/A',
        job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'N/A',
        job.poNumber || 'N/A',
        job.poDate ? new Date(job.poDate).toLocaleDateString() : 'N/A',
        typeof valueWithoutVAT === 'number' ? valueWithoutVAT.toFixed(2) : 'N/A',
        typeof valueWithVAT === 'number' ? valueWithVAT.toFixed(2) : 'N/A',
        paidAmount,
    balance,
        job.quotation?.paymentTerm ?? 'N/A',
        job.quotation?.paymentDelivery ?? 'N/A',
        job.projectType || 'N/A',
        job.quotation?.sale?.name || 'N/A',
        job.projectStatus || 'N/A',
      ];
    }),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Job Orders');

  XLSX.writeFile(workbook, filename);
};

 const handleExport = () => {
  const selectedJobs = localJobOrders.filter(job =>
    selectedIds.includes(job._id)
  );
  exportExcel(selectedJobs, 'selected_job_orders.xlsx');
};


  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(_id => _id !== id) : [...prev, id]
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <Search placeholder="Search for a Project..." />
        <div className={styles.topRight}>
          <Link href="/dashboard/jobOrder/add">
            <button className={styles.addButton}>Add New</button>
          </Link>
        </div>
      </div>

      <div className={styles.exportButtons}>
        <button
          onClick={handleExport}
          className={styles.exportButton}
          disabled={selectedIds.length === 0}
        >
          Export Selected
        </button>
        <button
  onClick={() => exportExcel(localJobOrders, 'all_job_orders.xlsx')}
  className={styles.exportButton}
>
  Export All
</button>

      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <td></td>
            <td>Client Name</td>
            <td>Quotation Number</td>
            <td>Job Order</td>
            <td>Project Name</td>
            <td>Project Type</td>
            <td>Project Status</td>
            <td>PO Amount</td>
              <td>Balance</td>
            <td>Paid Amount</td>
            <td>Payment Status</td>
            <td>Action</td>
          </tr>
        </thead>
        <tbody>
          {localJobOrders.map((job) => (
            <tr key={job._id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(job._id)}
                  onChange={() => toggleSelect(job._id)}
                />
              </td>
              <td>{job.client?.name || 'No client name'}</td>
              <td>{job.quotation?.quotationId}</td>
              <td>{job.jobOrderId}</td>
              <td>{job.quotation?.projectName}</td>
               <td>
                <select
                  className={styles.select}
                  value={job.projectType}
                  onChange={(e) =>
                    updateJobField(job._id, 'projectType', e.target.value)
                  }
                >
                  <option value="Supply">Supply</option>
                  <option value="Pro-Service">Pro-Service</option>
                  <option value="Supply & Pro-Service">Supply & Pro-Service</option>
                </select>
              </td>
              <td>
                <select
                  className={styles.select}
                  value={job.projectStatus}
                  onChange={(e) =>
                    updateJobField(job._id, 'projectStatus', e.target.value)
                  }
                >
                  <option value="OPEN">OPEN</option>
                  <option value="CLOSE">CLOSE</option>
                </select>
              </td>
                            <td>{job.value}</td>
                            <td>{job.remainingAmount}</td>
                            <td>{job.paidAmount?.toFixed(2) ?? 'N/A'}</td>

                            

                <td>

                      <div className={styles.paymentButtons}>

                  <button className={`${styles.button} ${styles.paid}`} onClick={() => openDialog(job._id, "paid")}>Paid</button>
                  <button className={`${styles.button} ${styles.partial}`}  onClick={() => openDialog(job._id, "partial")}>Partial</button>
               
                </div>
                </td>
              <td>
                      <div className={styles.paymentButtons}>

                  <form action={deleteJobOrder}>
                    <input type="hidden" name="id" value={job._id} />
                    <button className={`${styles.button} ${styles.delete}`}>Delete</button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination count={count} />

      {dialog.isOpen && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialog}>
            {currentJobOrder && (
              <p className={styles.poInfo}>
                Job Order: <strong>{currentJobOrder.jobOrderId}</strong>
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
              <p>Are you sure you want to mark this job order as <strong>{dialog.type.toUpperCase()}</strong>?</p>
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

export default ShowJobOrders;
