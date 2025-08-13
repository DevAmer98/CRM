"use client";
import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import styles from '@/app/ui/dashboard/approve/approve.module.css';
import { editQuotation, updateQuotation } from '@/app/lib/actions';

 


const SingleQuotation = ({params}) => { 
  const [selectedCurrency, setSelectedCurrency] = useState('USD'); 
  const [quotation, setQuotation] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    clientName: '', 
    projectName: '',
    projectLA: '',
    products: [],
    paymentTerm: '',
    paymentDelivery: '',
    validityPeriod: '',
    note: '', 
    excluding: '',
    totalPrice: ''
  });
  const [rows, setRows] = useState([]);
  const domain = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";



  useEffect(() => {
    const getQuotationById = async () => {
      try {
        console.log("process.env.DOMAIN:", process.env.NEXT_PUBLIC_API_URL);
        const response = await fetch(`${domain}/api/quotation/${params.id}`, {
          method: "GET",
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setQuotation(data);
      } catch (err) {
        setError(`Fetching failed: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
  
    getQuotationById();
  }, [params.id]);
  
  
      

  const downloadQuotationDocument = async () => {
    try {
      // Validate input data
      if (!rows || rows.length === 0) {
        throw new Error('No product rows available for generating the quotation.');
      }
  
      if (!formData || !quotation) {
        throw new Error('Missing required form data or quotation details.');
      }
  
      // Calculate totals
      const totalUnitPrice = rows.reduce((total, row) => total + Number(row.unitPrice || 0), 0);
      const vatRate = selectedCurrency === 'USD' ? 0 : 0.15; // 0% VAT for USD, 15% for SAR
      const vatAmount = totalUnitPrice * vatRate;
      const totalUnitPriceWithVAT = totalUnitPrice + vatAmount;
  
      // Prepare document data
      const documentData = {
        QuotationNumber: formData.quotationId || 'No Quotation ID',
        ClientName: formData.clientName || 'No Client Name',
        CreatedAt: new Date(quotation.createdAt || Date.now()).toISOString().split('T')[0], // Format: YYYY-MM-DD
        ProjectName: formData.projectName || 'No Project Name',
        ProjectLA: formData.projectLA || 'No Project Location Address',
        SaleName: quotation.sale?.name || 'No Sales Representative Name',
        ClientContactName: quotation.client?.contactName || 'No Client Contact Name',
        userName: quotation.user?.username || 'No User Name',
        ClientPhone: quotation.client?.phone || 'No Client Phone',
        UserPhone: quotation.sale?.phone || 'No Sales Representative Phone',
        UserEmail: quotation.sale?.email || 'No Sales Representative Email',
        UserAddress: quotation.sale?.address || 'No Sales Representative Address',
        ClientContactMobile: quotation.client?.contactMobile || 'No Client Contact Mobile',
        ClientEmail: quotation.client?.email || 'No Client Email',
        ClientAddress: quotation.client?.address || 'No Client Address',
        Currency: selectedCurrency,
        TotalPrice: formatCurrency(totalUnitPrice),
        VatRate: formatCurrency(vatRate),
        VatPrice: formatCurrency(vatAmount),
        NetPrice: formatCurrency(totalUnitPriceWithVAT),
        
        PaymentTerm: formData.paymentTerm || 'No Payment Term',
        PaymentDelivery: formData.paymentDelivery || 'No Delivery Term',
        Note: formData.note || 'No Note',
        Excluding: formData.excluding || 'No Exclusions',
        Products: rows.map((product, index) => ({
          Number: (index + 1).toString().padStart(3, '0'),
          ProductCode: product.productCode || 'No Product Code',
          UnitPrice: product.unitPrice || 0,
          Unit: product.unit || 'No Unit',
          Qty: product.qty || 0,
          Description: product.description || 'No Description',
        })),
      };
      
  
      console.log('Document Data:', documentData);
  
      // Make POST request to generate PDF
      const response = await fetch(`${domain}/api/loadQuoPdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(documentData),
      });
  
      if (response.ok) {
        const fileBlob = await response.blob();
        console.log('Blob size:', fileBlob.size);
  
        // Create a download link
        const link = document.createElement('a');
        link.href = URL.createObjectURL(fileBlob);
        link.download = `Quotation_${documentData.QuotationNumber}.pdf`;
  
        console.log('Blob URL:', link.href);
  
        // Trigger file download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
  
        console.log('File downloaded successfully');
      } else {
        const errorText = await response.text(); 
        console.error('Server response error:', errorText);
        throw new Error(`Server responded with status: ${response.status}, message: ${errorText}`);
      }
    } catch (error) {
      console.error('Error downloading the document:', error.message);
    }
  };



  const uploadQuotationDocument = async () => {
    try {
      // Validate input data
      if (!rows || rows.length === 0) {
        throw new Error('No product rows available for generating the quotation.');
      }
  
      if (!formData || !quotation) {
        throw new Error('Missing required form data or quotation details.');
      }
  
      // Calculate totals
      const totalUnitPrice = rows.reduce((total, row) => total + Number(row.unitPrice || 0), 0);
      const vatRate = selectedCurrency === 'USD' ? 0 : 0.15; // 0% VAT for USD, 15% for SAR
      const vatAmount = totalUnitPrice * vatRate;
      const totalUnitPriceWithVAT = totalUnitPrice + vatAmount;
  
      // Prepare document data for upload
      const documentData = {
        QuotationNumber: formData.quotationId || 'No Quotation ID',
        ClientName: formData.clientName || 'No Client Name',
        CreatedAt: new Date(quotation.createdAt || Date.now()).toISOString().split('T')[0], // Format: YYYY-MM-DD
        ProjectName: formData.projectName || 'No Project Name',
        ProjectLA: formData.projectLA || 'No Project Location Address',
        SaleName: quotation.sale?.name || 'No Sales Representative Name',
        ClientContactName: quotation.client?.contactName || 'No Client Contact Name',
        userName: quotation.user?.username || 'No User Name',
        ClientPhone: quotation.client?.phone || 'No Client Phone',
        UserPhone: quotation.sale?.phone || 'No Sales Representative Phone',
        UserEmail: quotation.sale?.email || 'No Sales Representative Email',
        UserAddress: quotation.sale?.address || 'No Sales Representative Address',
        ClientContactMobile: quotation.client?.contactMobile || 'No Client Contact Mobile',
        ClientEmail: quotation.client?.email || 'No Client Email',
        ClientAddress: quotation.client?.address || 'No Client Address',
       // CurrencySymbol: selectedCurrency === 'USD' ? '$' : 'SAR',
        Currency: selectedCurrency,
        TotalPrice: formatCurrency(totalUnitPrice),
        VatRate: formatCurrency(vatRate),
        VatPrice: formatCurrency(vatAmount),
        NetPrice: formatCurrency(totalUnitPriceWithVAT),
        PaymentTerm: formData.paymentTerm || 'No Payment Term',
        PaymentDelivery: formData.paymentDelivery || 'No Delivery Term',
        Note: formData.note || 'No Note',
        ValidityPeriod: formData.validityPeriod || 'No Validity Preiod',
        Excluding: formData.excluding || 'No Exclusions',
        Products: rows.map((product, index) => ({
          Number: (index + 1).toString().padStart(3, '0'),
          ProductCode: product.productCode || 'No Product Code',
          UnitPrice: formatCurrency(product.unitPrice || 0),
          Unit: product.unit || 'No Unit',
          Qty: product.qty || 0,
          Description: product.description || 'No Description',
        })),
      };
  
      // Log document data for debugging
      console.log('Document Data for upload:', documentData);
  
      // Make POST request to upload PDF to Synology
      const response = await fetch(`${domain}/api/loadQuoToSynology`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(documentData),
      });
  
      if (response.ok) {
        console.log('PDF uploaded successfully to Synology NAS');
        alert('PDF uploaded successfully!');
      } else {
        const errorText = await response.text();
        console.error('Server response error:', errorText);
        throw new Error(`Server responded with status: ${response.status}, message: ${errorText}`);
      }
    } catch (error) {
      console.error('Error uploading the document:', error.message);
      alert(`Error during upload: ${error.message}`);
    }
  };
  

  

      useEffect(() => {
        if (quotation) {
          setFormData({
            quotationId: quotation.quotationId,
            userName: quotation.user && quotation.user.username ? quotation.user.username : 'N/A',
            saleName:quotation.sale && quotation.sale.name ? quotation.sale.name : 'N/A',
            clientName: quotation.client && quotation.client.name ? quotation.client.name : 'N/A', 
            projectName: quotation.projectName,
            projectLA: quotation.projectLA,
            products: quotation.products,
            paymentTerm: quotation.paymentTerm,
            paymentDelivery: quotation.paymentDelivery,
            validityPeriod: quotation.validityPeriod,
            note: quotation.note,
            excluding: quotation.excluding,
            totalPrice: quotation.totalPrice || '', // Ensure totalPrice is set
          });

          setSelectedCurrency(quotation.currency || 'USD'); // Default to 'USD' if currency is not set
    
          const newRows = quotation.products.map((product, index) => ({
            _id: product._id,
            id: index + 1,
            number: index + 1,
            productCode: product.productCode,
            unitPrice: product.unitPrice,
            unit: product.unit,
            qty: product.qty,
            description: product.description,
          }));
          setRows(newRows);
        }
      }, [quotation]);

  if (isLoading) { 
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading quotation: {error}</div>;
  }

  if (!quotation) {
    return null;
  }

  
  const formatCurrency = (value) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'decimal', // Changed from 'currency' to 'decimal'
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return formatter.format(value);
  };
  



  
 

  const addRow = () => {
const newRow = {
  id: rows.length + 1,
  number: rows.length + 1,
  productCode: '',
  description: '',
  qty: '',
  unit: '',
  unitPrice: 0,
};
    setRows((prevRows) => [...prevRows, newRow]);
  };

  const deleteRow = (index) => {
    const updatedRows = rows.filter((_, i) => i !== index);
    const updatedRowsWithNumbers = updatedRows.map((row, i) => ({ ...row, number: i + 1 }));
    setRows(updatedRowsWithNumbers);
  };

  const handleRowInputChange = (index, fieldName, value) => {
    setRows((prevRows) =>
      prevRows.map((row, i) =>
        i === index
          ? {
              ...row,
              [fieldName]: value,
              unitPrice:
                fieldName === 'qty' && !isNaN(value) && !isNaN(row.unit)
                  ? Number(value) * Number(row.unit)
                  : fieldName === 'unit' && !isNaN(value) && !isNaN(row.qty)
                  ? Number(value) * Number(row.qty)
                  : row.unitPrice,
            }
          : row
      )
    );
  };
  const handleInputChange = (fieldName, value) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      [fieldName]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const rowInputs = rows.map((row) => ({
      productCode: row.productCode,
      unitPrice: row.unitPrice,
      unit: row.unit,
      qty: row.qty,
      description: row.description,
    }));

    await updateQuotation({
      id: params.id,
       ...formData,
      products: rowInputs,
    });
  };

const handleEdit = async (e) => {
  e.preventDefault();

  const rowInputs = rows.map((row) => ({
    productCode: row.productCode,
    unitPrice: row.unitPrice,
    unit: row.unit,
    qty: row.qty,
    description: row.description,
  }));

  // ✅ Call the function first
  const totals = calculateTotalUnitPrice();

  const payload = {
    id: params.id,
    ...formData,
    products: rowInputs,
    currency: selectedCurrency,
    totalPrice: Number(totals.totalUnitPrice), // ✅ use the returned value
  };

  console.log('Payload being sent:', payload);

  await editQuotation(payload);
};

    const calculateTotalUnitPrice = () => {
      const totalUnitPrice = rows.reduce((total, row) => total + (Number(row.unitPrice) || 0), 0);
      const vatRate = selectedCurrency === 'USD' ? 0 : 0.15; // 0% VAT for USD, 15% for SAR
      const vatAmount = totalUnitPrice * vatRate;
      const totalUnitPriceWithVAT = totalUnitPrice + vatAmount;
    
    
      return {
        totalUnitPrice: totalUnitPrice.toFixed(2), // Format to 2 decimal places
        vatAmount: vatAmount.toFixed(2), // Format to 2 decimal places
        totalUnitPriceWithVAT: totalUnitPriceWithVAT.toFixed(2), // Format to 2 decimal places
      };
    };

  return (
    
    <div>  
      <form onSubmit={handleSubmit}>
      
        <div className={styles.container}>
        <div className={styles.container}>
      Quotation ID: {formData.quotationId}
      </div>
      <button
  type="button"
  className={`${styles.DownloadButton}`}
  onClick={handleEdit}>
  Edit
</button>
      <button
  type="button"
  className={`${styles.DownloadButton} ${formData.userName && formData.userName.trim() !== 'N/A' ? '' : styles.DisabledButton}`}
  onClick={uploadQuotationDocument}
  disabled={!formData.userName || formData.userName.trim() === 'N/A'}
>
  Upload To Synology
</button>
 <button
  type="button"
  className={`${styles.DownloadButton}`}
  onClick={downloadQuotationDocument}
  disabled={!formData.userName || formData.userName.trim() === 'N/A'}
>
  Download PDF
</button>

          <div className={styles.form1}>
            <input type="hidden" name="id" value={params.id} />
            <div className={styles.inputContainer}>
                <label htmlFor="username" className={styles.label}>
                  Admin Name:
                </label>
            <input
              type="text"
              className={styles.input}
              value={formData.userName}
              onChange={(e) => handleInputChange('userName', e.target.value)}
              readOnly 
            />
            </div>
            <div className={styles.inputContainer}>
                <label htmlFor="clientName" className={styles.label}>
                  Client Name:
                </label>
            <input
              type="text"
              className={styles.input}
              value={formData.clientName}
              onChange={(e) => handleInputChange('clientName', e.target.value)}
              readOnly 
            />
            </div>
            <div className={styles.inputContainer}>
                <label htmlFor="saleName" className={styles.label}>
                Sale Representative Name:
                </label>
             <input
              type="text"
              className={styles.input}
              value={formData.saleName}
              onChange={(e) => handleInputChange('saleName', e.target.value)}
              readOnly 
            />
            </div>
            <div className={styles.inputContainer}>
                <label htmlFor="projectName" className={styles.label}>
                Project Name:
                </label>
            <input
              className={styles.input}
              value={formData.projectName}
              onChange={(e) => handleInputChange('projectName', e.target.value)}
            />
            </div>
            <div className={styles.inputContainer}>
                <label htmlFor="projectLA" className={styles.label}>
                  Project Location Address:
                </label>
            <input
              className={styles.input}
              value={formData.projectLA}
              onChange={(e) => handleInputChange('projectLA', e.target.value)}
            />
            </div>
          </div>
        </div>
        <div className={styles.container}>
          <div className={styles.form2}>
            <p className={styles.title}>Products</p>
            <div className={styles.selectContainer}>
            <div className={styles.selectWrapper}>
            <label htmlFor="currency" className={styles.selectLabel}>Select Currency:</label>
          <select
          id="currency"
          value={selectedCurrency}
          onChange={(e) => setSelectedCurrency(e.target.value)}
          className={styles.select}
          >
          <option value="USD">USD</option>
          <option value="SAR">SAR</option>
        </select>
        </div>
        </div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <td>Number</td>
                  <td>Product Code</td>
                  <td>Description</td>
                  <td>Qty</td>
                  <td>Unit Price</td>
                  <td>Total Price</td>

                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id} className={styles.row}>
                    <td>
                      <input
                        className={`${styles.input} ${styles.numberInput}`}
                        type="text"
                        value={row.number.toString().padStart(3, '0')}
                        readOnly
                      />
                    </td>
                    <td>
                      <input
                        className={styles.input1}
                        placeholder={row.productCode}
                        value={row.productCode}
                        onChange={(e) => handleRowInputChange(index, 'productCode', e.target.value)}
                      />
                    </td>
                    <td>
                    <textarea
                        className={`${styles.input1} ${styles.textarea}`}
                        placeholder={row.description}
                        value={row.description}
                        onChange={(e) => handleRowInputChange(index, 'description', e.target.value)}
                      ></textarea>
                    </td>
                    <td>
                      <input
                        className={styles.input1}
                        placeholder={row.qty}
                        value={row.qty}
                        onChange={(e) => handleRowInputChange(index, 'qty', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className={styles.input1}
                        placeholder={row.unit}
                        value={row.unit}
                        onChange={(e) => handleRowInputChange(index, 'unit', e.target.value)}
                      />
                    </td>
                    <td>
                    
                    {formatCurrency(Number(row.unitPrice) || 0, selectedCurrency)}

                    </td>
                    <td>
                      {index === rows.length - 1 ? (
                        <button
                          type="button"
                          className={`${styles.iconButton} ${styles.addButton}`}
                          onClick={addRow}
                        >
                          <FaPlus />
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={`${styles.iconButton} ${styles.deleteButton}`}
                          onClick={() => deleteRow(index)}
                        >
                          <FaTrash />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className={styles.container}>
        
          <div className={styles.form5}>
            <p>Total Unit Price (Excluding VAT): {formatCurrency(calculateTotalUnitPrice().totalUnitPrice)}</p>
            <p>VAT (15%): {formatCurrency(calculateTotalUnitPrice().vatAmount)}</p>
            <p>Total Unit Price (Including VAT): {formatCurrency(calculateTotalUnitPrice().totalUnitPriceWithVAT)}</p>
</div>
        </div>
        <div className={styles.container}>
          <div className={styles.form1}>
          <div className={styles.inputContainer}>
            <label htmlFor="paymentTerm" className={styles.label}>
               Payment Term:
            </label>
            <textarea
              className={styles.input}
              placeholder="paymentTerm"
              value={formData.paymentTerm}
              onChange={(e) => handleInputChange('paymentTerm', e.target.value)}
            />
            </div>
            <div className={styles.inputContainer}>
            <label htmlFor="paymentDelivery" className={styles.label}>
            Payment Delivery:
            </label>
            <textarea
              className={styles.input}
              placeholder="paymentDelivery"
              value={formData.paymentDelivery}
              onChange={(e) => handleInputChange('paymentDelivery', e.target.value)}
            />
            </div>
            <div className={styles.inputContainer}>
            <label htmlFor="validityPeriod" className={styles.label}>
            Validity Period:
            </label>
            <textarea
              className={styles.input}
              value={formData.validityPeriod}
              onChange={(e) => handleInputChange('validityPeriod', e.target.value)}
            />
            </div>
            <div className={styles.inputContainer}>
            <label htmlFor="note" className={styles.label}>
               Note:
            </label>
            <textarea
              className={styles.input}
              value={formData.note}
              onChange={(e) => handleInputChange('note', e.target.value)}
            />
            </div>
            <div className={styles.inputContainer}>
            <label htmlFor="excluding" className={styles.label}>
            Excluding:
            </label>
            <textarea
              className={styles.input}
              value={formData.excluding}
              onChange={(e) => handleInputChange('excluding', e.target.value)}
            />
            </div>
            <button type="submit">Update</button>
          </div>
        </div>
      </form>
    </div>
  );
  
};




export default SingleQuotation;
