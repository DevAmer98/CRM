"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import styles from '@/app/ui/dashboard/quotations/quotations.module.css';

const defaultEditForm = {
  poNumber: '',
  poDate: '',
  projectType: 'Supply',
  projectStatus: 'OPEN',
  value: '',
  baseValue: '',
  currency: 'USD',
};

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    return 'N/A';
  }
  return Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const JobOrderDetailsPage = ({ initialJobOrder }) => {
  const [jobOrder, setJobOrder] = useState(initialJobOrder);
  const [editForm, setEditForm] = useState({
    ...defaultEditForm,
    poNumber: jobOrder.poNumber || '',
    poDate: jobOrder.poDate ? jobOrder.poDate.slice(0, 10) : '',
    projectType: jobOrder.projectType || 'Supply',
    projectStatus: jobOrder.projectStatus || 'OPEN',
    value:
      jobOrder.value !== undefined && jobOrder.value !== null
        ? jobOrder.value.toString()
        : '',
    baseValue: jobOrder.baseValue ? jobOrder.baseValue.toString() : '',
    currency: jobOrder.currency || 'USD',
  });
  const [isSaving, setIsSaving] = useState(false);

  const quotationDetails = jobOrder.quotation;
  const jobProducts = jobOrder.products || [];
  const displayProducts =
    quotationDetails?.products?.length ? quotationDetails.products : jobProducts;
  const showProductsSection = quotationDetails || displayProducts.length > 0;

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

    const poNumber = editForm.poNumber.trim();
    if (!poNumber) {
      alert('PO Number is required.');
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
      poDate: editForm.poDate || null,
      projectType: editForm.projectType,
      projectStatus: editForm.projectStatus,
      currency: editForm.currency,
      value: valueNumber,
      baseValue: editForm.currency === 'SAR' ? baseValueNumber : 0,
    };

    setIsSaving(true);
    try {
      const res = await fetch(`/api/jobOrder/${jobOrder._id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to update job order');
      }

      setJobOrder((prev) => ({ ...prev, ...payload }));
      alert('Job order updated successfully.');
    } catch (error) {
      console.error('Error updating job order:', error);
      alert('Failed to update job order.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className={styles.detailsCard}>
      <div className={styles.detailsHeader}>
        <Link href="/dashboard/jobOrder" className={styles.backLink}>
          ← Back to Job Orders
        </Link>
        <div>
          <p className={styles.detailsLabel}>Job Order</p>
          <h2 className={styles.detailsTitle}>{jobOrder.jobOrderId}</h2>
        </div>
      </div>

      <div className={styles.dialogSummary}>
        <div>
          <strong>Client</strong>
          <span>{jobOrder.client?.name || 'N/A'}</span>
        </div>
        <div>
          <strong>Quotation</strong>
          <span>{jobOrder.quotation?.quotationId || 'N/A'}</span>
        </div>
        <div>
          <strong>Project Name</strong>
          <span>{jobOrder.quotation?.projectName || 'N/A'}</span>
        </div>
      </div>

      {showProductsSection && (
        <div className={styles.quotationSection}>
          <div className={styles.quotationHeader}>
            <div>
              <h4>{quotationDetails ? 'Quotation Items' : 'Job Order Products'}</h4>
              <p>
                {quotationDetails
                  ? 'Linked quotation details'
                  : 'Products captured for this job order'}
              </p>
            </div>
            <div className={styles.quotationMeta}>
              <span>
                <strong>Currency</strong>
                {quotationDetails?.currency || jobOrder.currency || 'N/A'}
              </span>
              <span>
                <strong>Total</strong>
                {formatCurrency(quotationDetails?.totalPrice ?? jobOrder.value)}
              </span>
            </div>
          </div>
          {displayProducts.length > 0 ? (
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
                  {displayProducts.map((product, index) => (
                    <tr key={`${product.productCode || 'product'}-${index}`}>
                      <td>{product.productCode || '-'}</td>
                      <td
                        dangerouslySetInnerHTML={{
                          __html: product.description || '-',
                        }}
                      ></td>
                      <td>{product.qty ?? '-'}</td>
                      <td>{product.unit ?? '-'}</td>
                      <td>{formatCurrency(product.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={styles.emptyQuotation}>No products available.</p>
          )}
          <div className={styles.quotationFooter}>
            <div>
              <span>Subtotal</span>
              <strong>
                {formatCurrency(
                  quotationDetails
                    ? quotationDetails.subtotal ??
                        quotationDetails.totalPrice ??
                        jobOrder.value
                    : jobOrder.currency === 'SAR' && jobOrder.baseValue
                    ? jobOrder.baseValue
                    : jobOrder.value
                )}
              </strong>
            </div>
            <div>
              <span>Discount</span>
              <strong>
                {quotationDetails?.totalDiscount
                  ? `${quotationDetails.totalDiscount}%`
                  : '—'}
              </strong>
            </div>
            <div>
              <span>VAT</span>
              <strong>
                {quotationDetails
                  ? formatCurrency(quotationDetails.vatAmount)
                  : jobOrder.currency === 'SAR' && jobOrder.baseValue
                  ? formatCurrency(jobOrder.value - jobOrder.baseValue)
                  : '—'}
              </strong>
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
          <Link href="/dashboard/jobOrder" className={styles.cancel}>
            Back
          </Link>
        </div>
      </form>
    </section>
  );
};

export default JobOrderDetailsPage;
