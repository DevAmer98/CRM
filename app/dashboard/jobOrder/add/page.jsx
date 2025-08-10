"use client";
import React, { useState, useEffect } from 'react';
import styles from '@/app/ui/dashboard/jobOrder/jobOrder.module.css';
import { useRouter } from 'next/navigation';

const AddJobOrderPage = () => {
  const [clientsWithInfo, setClientsWithInfo] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedQuotation, setSelectedQuotation] = useState('');
  const [selectedPO, setSelectedPO] = useState('');
  const [selectedPODate, setSelectedPODate] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [value, setValue] = useState('');

  const valueWithVAT =
    currency === 'SAR' && value
      ? (parseFloat(value) * 1.15).toFixed(2)
      : value;

  const domain = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const router = useRouter();

  useEffect(() => {
    const fetchClientsWithQuotations = async () => {
      try {
        const response = await fetch(`${domain}/api/clientWithQuoAndPo`, {
          method: "POST"
        });
        if (response.ok) {
          const data = await response.json();
          const simplifiedData = data.clientsWithQuotations.map(client => ({
            ...client,
            _id: client._id.toString(),
            quotations: client.quotations.map(quotation => ({
              ...quotation,
              _id: quotation._id.toString()
            }))
          }));
          setClientsWithInfo(simplifiedData);
        } else {
          console.error('Failed to fetch clients with quotations');
        }
      } catch (error) {
        console.error('Error fetching clients with quotations:', error);
      }
    };

    fetchClientsWithQuotations();
  }, []);

  const selectedClientData = clientsWithInfo.find(c => c._id === selectedClient);
  const selectedQuotationData = selectedClientData?.quotations.find(q => q._id === selectedQuotation);
  const quotationProducts = selectedQuotationData?.products || [];

  const handleClientChange = (e) => {
    setSelectedClient(e.target.value);
    setSelectedQuotation('');
    setSelectedPO('');
    setSelectedPODate('');
  };

  const handleQuotationChange = (e) => {
    setSelectedQuotation(e.target.value);
  };

  const handleUploadPO = async (e) => {
    e.preventDefault();

    if (!selectedClient || !selectedQuotation || !selectedPO || !selectedPODate || !value) {
      alert('Please fill in all fields.');
      return;
    }

    const baseValue = parseFloat(value);

    const formData = {
      poNumber: selectedPO,
      poDate: selectedPODate,
      clientId: selectedClient,
      quotationId: selectedQuotation,
      value,
      baseValue,
      currency
    };

    try {
      const res = await fetch('/api/jobOrder/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert('Job order created successfully!');
        setSelectedPO('');
        setSelectedPODate('');
        setValue('');
        router.push('/dashboard/jobOrder');
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to create job order.');
      }
    } catch (error) {
      console.error('Error uploading PO:', error);
      alert('Server error.');
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <form onSubmit={handleUploadPO} className={styles.form}>

          <div className={styles.formRow}>
            <div>
              <label>Client</label>
              <select value={selectedClient} onChange={handleClientChange}>
                <option value="">Select Client</option>
                {clientsWithInfo.map(client => (
                  <option key={client._id} value={client._id}>{client.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label>Quotation</label>
              <select value={selectedQuotation} onChange={handleQuotationChange} disabled={!selectedClient}>
                <option value="">Select Quotation</option>
                {selectedClientData?.quotations.map(quotation => (
                  <option key={quotation._id} value={quotation._id}>{quotation.projectName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div>
              <label>PO Number</label>
              <input
                type="text"
                value={selectedPO}
                onChange={(e) => setSelectedPO(e.target.value)}
              />
            </div>

            <div>
              <label>PO Date</label>
              <input
                type="date"
                value={selectedPODate}
                onChange={(e) => setSelectedPODate(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div>
              <label>Currency</label>
              <select
                className={styles.currencySelect}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="USD">USD</option>
                <option value="SAR">SAR</option>
              </select>
            </div>

            <div>
              <label>Value (without VAT)</label>
              <input
                type="number"
                step="0.01"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
          </div>

          {currency === 'SAR' && value && (
            <div className={styles.vatBox}>
              Value with VAT (15%): SAR {valueWithVAT}
            </div>
          )}

          <button type="submit">Upload PO</button>
        </form>

        {quotationProducts.length > 0 && (
          <div className={styles.tableContainer}>
            <h3>Quotation Products</h3>
            <table className={styles.productTable}>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Description</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {quotationProducts.map((product, index) => (
                  <tr key={index}>
                    <td>{product.productCode || '-'}</td>
                    <td>{product.description || '-'}</td>
                    <td>{product.qty || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddJobOrderPage;
