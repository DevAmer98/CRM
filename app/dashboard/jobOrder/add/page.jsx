"use client"
import React, { useState, useEffect } from 'react';
import styles from '@/app/ui/dashboard/jobOrder/jobOrder.module.css';
import { addJobOrder } from '@/app/lib/actions';

const AddJobOrderPage = () => {
  const [clientsWithInfo, setClientsWithInfo] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedQuotation, setSelectedQuotation] = useState('');
  const [selectedPO, setSelectedPO] = useState('');
  const [selectedPODate, setSelectedPODate] = useState('');
  const domain = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";




 useEffect(()=> {
  const fetchClientsWithQuotations = async () => {
    try {
      const response = await fetch(`${domain}/api/clientWithQuoAndPo`, {
        method: "POST"
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched data:', data);  // Log fetched data
        const simplifiedData = data.clientsWithQuotations.map(client => ({
          ...client,
          _id: client._id.toString(),
          quotations: client.quotations.map(quotation => ({
            ...quotation,
            _id: quotation._id.toString() 
          }))
        }));
        console.log('Simplified data:', simplifiedData);  // Log simplified data
        setClientsWithInfo(JSON.parse(JSON.stringify(simplifiedData)));
      } else {
        console.error('Failed to fetch clients with quotations');
      }
    } catch (error) {
      console.error('Error fetching clients with quotations:', error);
    }
  };

    // Fetch clients with quotations on component mount
    fetchClientsWithQuotations();
  }, []);

  const renderClientOptions = () => (
    <>
      <option value="">Select Client</option>
      {clientsWithInfo.map((client) => (
        <option key={client._id.toString()} value={client._id.toString()}>
          {client.name}
        </option>
      ))}
    </>
  );

  const renderQuotationOptions = () => {
    const selectedClientData = clientsWithInfo.find(c => c._id === selectedClient);
   

    return (
      <>
        <option value="">Select Quotation</option>
        {selectedClientData?.quotations.map((quotation) => (
        <option key={quotation._id} value={quotation._id}>
        {quotation.projectName}
  </option>
))}
      </>
    );
  };

  const handleClientChange = (e) => {
    const newClient = e.target.value;
    setSelectedClient(newClient);
    setSelectedQuotation(''); 
    setSelectedPO('');
    setSelectedPODate('');
  };

  const handleQuotationChange = (e) => {
    const newQuotation = e.target.value;
    setSelectedQuotation(newQuotation);
  };

  const handleUploadPO = async (e) => {
    e.preventDefault();

    if (!selectedClient || !selectedQuotation) {
      console.error('Please select a client and a quotation.');
      return;
    }

    const formData = {
      poNumber: selectedPO,
      poDate: selectedPODate,
      clientId: selectedClient,
      quotationId: selectedQuotation,
    };

    try {
      await addJobOrder(formData);
      setSelectedPO('');
      setSelectedPODate('');
    } catch (error) {
      console.error('Error uploading PO:', error);
    }
  };

  return (
    <div className={styles.wrapper}>
    <div className={styles.container}>
      <form onSubmit={handleUploadPO} className={styles.form}>
        <select name="clientId" onChange={handleClientChange} value={selectedClient}>
          {renderClientOptions()}
        </select>
        <select name="quotationId" onChange={handleQuotationChange} value={selectedQuotation}>
          {renderQuotationOptions()}
        </select>
        <input
          name="poNumber"
          placeholder="PO number"
          onChange={(e) => setSelectedPO(e.target.value)}
          value={selectedPO}
        />
        <input
          name="poDate"
          placeholder="PO date"
          onChange={(e) => setSelectedPODate(e.target.value)}
          value={selectedPODate}
        />
        <button type="submit">Upload PO</button>
      </form>
    </div>
    </div>
  );
};

export default AddJobOrderPage;
