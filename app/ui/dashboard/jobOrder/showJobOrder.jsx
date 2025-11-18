"use client";
import React, { useState, useEffect } from 'react';
import styles from '@/app/ui/dashboard/quotations/quotations.module.css';
import Search from '@/app/ui/dashboard/search/search';
import Link from 'next/link';
import Pagination from '@/app/ui/dashboard/pagination/pagination';
import { deleteJobOrder } from '@/app/lib/actions';
import * as XLSX from 'xlsx';
import { Eye, X } from 'lucide-react';

const defaultEditForm = {
  poNumber: '',
  poDate: '',
  projectType: 'Supply',
  projectStatus: 'OPEN',
  value: '',
  baseValue: '',
  currency: 'USD',
};

const ShowJobOrders = ({ jobOrders, count }) => {
  const [localJobOrders, setLocalJobOrders] = useState(jobOrders);
  const [selectedIds, setSelectedIds] = useState([]);

  const [dialog, setDialog] = useState({
    isOpen: false,
    type: '', // "paid", "partial"
    jobOrderId: null,
  });
  const [partialAmount, setPartialAmount] = useState('');
  const [viewDialog, setViewDialog] = useState({
    isOpen: false,
    jobOrderId: null,
  });
  const [editForm, setEditForm] = useState(defaultEditForm);
  const [isSaving, setIsSaving] = useState(false);

  const initialRemaining = jobOrders.reduce((acc, job) => {
    acc[job._id] = job.remainingAmount ?? job.value;
    return acc;
  }, {});
  const [remainingAmounts, setRemainingAmounts] = useState(initialRemaining);

  const currentJobOrder = localJobOrders.find(j => j._id === dialog.jobOrderId);
  const jobOrderForView = localJobOrders.find(j => j._id === viewDialog.jobOrderId);
  const quotationDetails = jobOrderForView?.quotation;
  const quotationProducts = quotationDetails?.products || [];

  useEffect(() => {
    setLocalJobOrders(jobOrders);
  }, [jobOrders]);

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
      return 'N/A';
    }
    return Number(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

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

  const openJobDetails = (job) => {
    setViewDialog({ isOpen: true, jobOrderId: job._id });
    setEditForm({
      poNumber: job.poNumber || '',
      poDate: job.poDate || '',
      projectType: job.projectType || 'Supply',
      projectStatus: job.projectStatus || 'OPEN',
      value:
        job.value !== undefined && job.value !== null
          ? job.value.toString()
          : '',
      baseValue: job.baseValue ? job.baseValue.toString() : '',
      currency: job.currency || 'USD',
    });
  };

  const closeJobDetails = () => {
    setViewDialog({ isOpen: false, jobOrderId: null });
    setEditForm({ ...defaultEditForm });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    if (name === 'currency' && value !== 'SAR') {
      setEditForm((prev) => ({
        ...prev,
        currency: value,
        baseValue: '',
      }));
      return;
    }

    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveEdits = async (e) => {
    e.preventDefault();
    if (!viewDialog.jobOrderId) return;

    const poNumber = editForm.poNumber.trim();
    if (!poNumber) {
      alert('PO Number is required.');
      return;
    }

    if (!editForm.poDate) {
      alert('PO Date is required.');
      return;
    }

    const valueNumber = Number(editForm.value);
    if (Number.isNaN(valueNumber) || valueNumber <= 0) {
      alert('Please enter a valid PO amount.');
      return;
    }

    let baseValueNumber = 0;
    if (editForm.currency === 'SAR') {
      baseValueNumber = Number(editForm.baseValue);
      if (Number.isNaN(baseValueNumber) || baseValueNumber <= 0) {
        alert('Please enter the base value without VAT.');
        return;
      }
    }

    const payload = {
      poNumber,
      poDate: editForm.poDate,
      projectType: editForm.projectType,
      projectStatus: editForm.projectStatus,
      currency: editForm.currency,
      value: valueNumber,
      baseValue: editForm.currency === 'SAR' ? baseValueNumber : 0,
    };

    setIsSaving(true);
    try {
      const res = await fetch(`/api/jobOrder/${viewDialog.jobOrderId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to update job order');
      }

      setLocalJobOrders((prev) =>
        prev.map((job) =>
          job._id === viewDialog.jobOrderId ? { ...job, ...payload } : job
        )
      );
      alert('Job order updated successfully.');
      closeJobDetails();
    } catch (error) {
      console.error('Error updating job order:', error);
      alert('Failed to update job order.');
    } finally {
      setIsSaving(false);
    }
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

                  <button
                    type="button"
                    className={styles.eyeButton}
                    title="View Job Order"
                    onClick={() => openJobDetails(job)}
                  >
                    <Eye size={18} />
                  </button>
                  <form
                    action={deleteJobOrder}
                    onSubmit={(e) => {
                      const confirmed = window.confirm(
                        'Are you sure you want to delete this job order? This action cannot be undone.'
                      );
                      if (!confirmed) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <input type="hidden" name="id" value={job._id} />
                    <button
                      className={styles.iconDeleteButton}
                      title="Delete Job Order"
                    >
                      <X size={16} />
                    </button>
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
      {viewDialog.isOpen && jobOrderForView && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialog}>
            <h3 className={styles.dialogTitle}>Job Order Details</h3>
            <div className={styles.dialogSummary}>
              <div>
                <strong>Job Order</strong>
                <span>{jobOrderForView.jobOrderId}</span>
              </div>
              <div>
                <strong>Client</strong>
                <span>{jobOrderForView.client?.name || 'N/A'}</span>
              </div>
              <div>
                <strong>Quotation</strong>
                <span>{jobOrderForView.quotation?.quotationId || 'N/A'}</span>
              </div>
            </div>
            {quotationDetails && (
              <div className={styles.quotationSection}>
                <div className={styles.quotationHeader}>
                  <div>
                    <h4>Quotation Items</h4>
                    <p>Linked quotation details</p>
                  </div>
                  <div className={styles.quotationMeta}>
                    <span>
                      <strong>Currency</strong>
                      {quotationDetails.currency || jobOrderForView.currency || 'N/A'}
                    </span>
                    <span>
                      <strong>Total</strong>
                      {formatCurrency(quotationDetails.totalPrice ?? jobOrderForView.value)}
                    </span>
                  </div>
                </div>
                {quotationProducts.length > 0 ? (
                  <div className={styles.quotationTableWrapper}>
                    <table className={styles.quotationTable}>
                      <thead>
                        <tr>
                          <th>Code</th>
                          <th>Description</th>
                          <th>Qty</th>
                          <th>Unit</th>
                          <th>Unit Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quotationProducts.map((product, index) => (
                          <tr key={`${product.productCode || 'product'}-${index}`}>
                            <td>{product.productCode || '-'}</td>
                            <td>{product.description || '-'}</td>
                            <td>{product.qty ?? '-'}</td>
                            <td>{product.unit ?? '-'}</td>
                            <td>{formatCurrency(product.unitPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className={styles.emptyQuotation}>No quotation items available.</p>
                )}
                <div className={styles.quotationFooter}>
                  <div>
                    <span>Subtotal</span>
                    <strong>
                      {formatCurrency(
                        quotationDetails.subtotal ?? quotationDetails.totalPrice ?? jobOrderForView.value
                      )}
                    </strong>
                  </div>
                  <div>
                    <span>Discount</span>
                    <strong>
                      {quotationDetails.totalDiscount
                        ? `${quotationDetails.totalDiscount}%`
                        : '—'}
                    </strong>
                  </div>
                  <div>
                    <span>VAT</span>
                    <strong>{formatCurrency(quotationDetails.vatAmount)}</strong>
                  </div>
                </div>
              </div>
            )}
            <form className={styles.dialogForm} onSubmit={handleSaveEdits}>
              <div className={styles.dialogRow}>
                <div className={styles.dialogFormGroup}>
                  <label htmlFor="poNumber">PO Number</label>
                  <input
                    id="poNumber"
                    name="poNumber"
                    type="text"
                    className={styles.dialogInput}
                    value={editForm.poNumber}
                    onChange={handleEditChange}
                    disabled={isSaving}
                  />
                </div>
                <div className={styles.dialogFormGroup}>
                  <label htmlFor="poDate">PO Date</label>
                  <input
                    id="poDate"
                    name="poDate"
                    type="date"
                    className={styles.dialogInput}
                    value={editForm.poDate}
                    onChange={handleEditChange}
                    disabled={isSaving}
                  />
                </div>
              </div>
              <div className={styles.dialogRow}>
                <div className={styles.dialogFormGroup}>
                  <label htmlFor="projectType">Project Type</label>
                  <select
                    id="projectType"
                    name="projectType"
                    className={styles.dialogSelect}
                    value={editForm.projectType}
                    onChange={handleEditChange}
                    disabled={isSaving}
                  >
                    <option value="Supply">Supply</option>
                    <option value="Pro-Service">Pro-Service</option>
                    <option value="Supply & Pro-Service">Supply & Pro-Service</option>
                  </select>
                </div>
                <div className={styles.dialogFormGroup}>
                  <label htmlFor="projectStatus">Project Status</label>
                  <select
                    id="projectStatus"
                    name="projectStatus"
                    className={styles.dialogSelect}
                    value={editForm.projectStatus}
                    onChange={handleEditChange}
                    disabled={isSaving}
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="CLOSE">CLOSE</option>
                  </select>
                </div>
              </div>
              <div className={styles.dialogRow}>
                <div className={styles.dialogFormGroup}>
                  <label htmlFor="currency">Currency</label>
                  <select
                    id="currency"
                    name="currency"
                    className={styles.dialogSelect}
                    value={editForm.currency}
                    onChange={handleEditChange}
                    disabled={isSaving}
                  >
                    <option value="USD">USD</option>
                    <option value="SAR">SAR</option>
                  </select>
                </div>
                <div className={styles.dialogFormGroup}>
                  <label htmlFor="value">PO Amount</label>
                  <input
                    id="value"
                    name="value"
                    type="number"
                    step="0.01"
                    className={styles.dialogInput}
                    value={editForm.value}
                    onChange={handleEditChange}
                    disabled={isSaving}
                  />
                </div>
              </div>
              {editForm.currency === 'SAR' && (
                <div className={styles.dialogFormGroup}>
                  <label htmlFor="baseValue">Base Value (before VAT)</label>
                  <input
                    id="baseValue"
                    name="baseValue"
                    type="number"
                    step="0.01"
                    className={styles.dialogInput}
                    value={editForm.baseValue}
                    onChange={handleEditChange}
                    disabled={isSaving}
                  />
                </div>
              )}
              <div className={styles.dialogButtons}>
                <button type="submit" className={styles.confirm} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  className={styles.cancel}
                  onClick={closeJobDetails}
                  disabled={isSaving}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowJobOrders;
