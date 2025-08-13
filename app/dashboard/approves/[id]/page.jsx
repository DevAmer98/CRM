"use client";
import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import styles from '@/app/ui/dashboard/approve/approve.module.css';
import { updateQuotationApprove } from '@/app/lib/actions';


const SingleApprovePage = ({params}) => {
  const [selectedCurrency, setSelectedCurrency] = useState('USD'); 
  const [quotation, setQuotation] = useState(null);
  const [users, setUsers] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    sale:'', 
    clientName: '', 
    projectName: '',
    projectLA: '',
    products: [],
    paymentTerm: '',
    paymentDelivery: '',
    note: '',
    excluding: '',
  });
  const [rows, setRows] = useState([]);
  const domain = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const [isUploaded, setIsUploaded] = useState(false); // Add this line to track upload status




  const [updateTrigger, setUpdateTrigger] = useState(false);

// Function to fetch quotation data
useEffect(() => {
  const getQuotationById = async () => {
    try {
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
}, [params.id, updateTrigger]); 


  
  
      useEffect(() => {
        const fetchUsers= async () => {
          try {
            const response = await fetch(`${domain}/api/allUsers`, { method: 'GET' });
            const data = await response.json();
            setUsers(data);
            setLoading(false);
          } catch (error) {
            console.error('Error fetching users:', error);
            setLoading(false);
          }
        };
      
        fetchUsers();
      }, []);
      

      const downloadQuotationPdfDocument = async () => {
        try {
          const totalUnitPrice = rows.reduce((total, row) => total + Number(row.unitPrice || 0), 0);
          const vatRate = selectedCurrency === 'USD' ? 0 : 0.15; // 0% VAT for USD, 15% for SAR
          const vatAmount = totalUnitPrice * vatRate;
          const totalUnitPriceWithVAT = totalUnitPrice + vatAmount;

          // Prepare the data for the document
          const documentData = {
            QuotationNumber:quotation.quotationId,
            ClientName: quotation.client?.name, 
            userName: quotation.user?.username, 
            ClientPhone: quotation.client?.phone || 'No address provided',
            ClientEmail: quotation.client?.email || 'No contact info',
            ClientAddress: quotation.client?.address || 'No address info',
            ClientContactMobile: quotation.client?.contactMobile || 'No contact info',
            ClientContactName: quotation.client?.contactName || 'No contact info',
            SaleName: quotation.sale?.name || 'No address provided',
            UserPhone: quotation.sale?.phone || 'No address provided',
            UserEmail: quotation.sale?.email || 'No contact info',
            UserAddress: quotation.sale?.address || 'No address info',
            ProjectName:quotation.projectName,
            ProjectLA:quotation.projectLA,
            Products: quotation.products.map((product, index) => ({
              Number: (index + 1).toString().padStart(3, '0'),
              ProductCode: product.productCode,
              UnitPrice: product.unitPrice,
              Unit: product.unit,
              Qty: product.qty,
              Description: product.description,
            })),
            CurrencySymbol: selectedCurrency === 'USD' ? '$' : 'SAR', // Adjust this based on your requirements
            TotalPrice: totalUnitPrice.toFixed(2),
            VatRate: vatRate.toFixed(2),
            VatPrice: vatAmount.toFixed(2),
            NetPrice: totalUnitPriceWithVAT.toFixed(2),
            PaymentTerm:quotation.paymentTerm,
            PaymentDelivery:quotation.paymentDelivery,
            Note:quotation.note,
            Excluding:quotation.excluding,
            CreatedAt:quotation.createdAt ? new Date(quotation.createdAt).toDateString().slice(4, 16) : '',
          };
    
          // Send data to the server to create the document
          const response = await fetch(`${domain}/api/loadQuoPdf`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(documentData),
          });
    
          if (response.ok) {
            // Create a Blob from the PDF Stream
            const fileBlob = await response.blob();
            const link = document.createElement('a');
            link.href = URL.createObjectURL(fileBlob);
            link.download = `Quotation_${documentData.QuotationNumber}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } else {
            throw new Error(`Server responded with status: ${response.status}`);}
             } catch (error) {
              console.error('Error downloading the document:', error);
          }
      };

      const downloadQuotationWordDocument = async () => {
        try {
          const totalUnitPrice = rows.reduce((total, row) => total + Number(row.unitPrice || 0), 0);
          const vatRate = selectedCurrency === 'USD' ? 0 : 0.15; // 0% VAT for USD, 15% for SAR
          const vatAmount = totalUnitPrice * vatRate;
          const totalUnitPriceWithVAT = totalUnitPrice + vatAmount;

        const documentData = {
            QuotationNumber:quotation.quotationId,
            ClientName: quotation.client?.name, 
            userName: quotation.user?.username, 
            ClientPhone: quotation.client?.phone || 'No address provided',
            ClientEmail: quotation.client?.email || 'No contact info',
            ClientAddress: quotation.client?.address || 'No address info',
            ClientContactMobile: quotation.client?.contactMobile || 'No contact info',
            ClientContactName: quotation.client?.contactName || 'No contact info',
            SaleName: quotation.sale?.name || 'No address provided',
            UserPhone: quotation.sale?.phone || 'No address provided',
            UserEmail: quotation.sale?.email || 'No contact info',
            UserAddress: quotation.sale?.address || 'No address info',
            ProjectName:quotation.projectName,
            ProjectLA: quotation.projectLA,
            Products: quotation.products.map((product, index) => ({
              Number: (index + 1).toString().padStart(3, '0'),
              ProductCode: product.productCode,
              UnitPrice: product.unitPrice.toFixed(2),
              Unit: product.unit,
              Qty: product.qty,
              Description: product.description,
            })),
            Currency: selectedCurrency === 'USD' ? '$' : 'SAR', // Adjust this based on your requirements
            TotalPrice: totalUnitPrice.toFixed(2),
            VatRate: vatRate.toFixed(2),
            VatPrice: vatAmount.toFixed(2),
            NetPrice: totalUnitPriceWithVAT.toFixed(2),
            PaymentTerm:quotation.paymentTerm,
            PaymentDelivery:quotation.paymentDelivery,
            Note:quotation.note,
            Excluding:quotation.excluding,
            CreatedAt: quotation.createdAt ? new Date(quotation.createdAt).toDateString().slice(4, 16) : '',
          };
    
          // Send data to the server to create the document
          const response = await fetch(`${domain}/api/loadQuoWord`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(documentData),
          });
    
          if (response.ok) {
            const fileBlob = await response.blob();
            const link = document.createElement('a');
            link.href = URL.createObjectURL(fileBlob);
            link.download = `Quotation_${documentData.QuotationNumber}.docx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } else {
            throw new Error(`Server responded with status: ${response.status}`);}
             } catch (error) {
              console.error('Error downloading the document:', error);
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
            Currency: selectedCurrency === 'USD' ? '$' : 'SAR',
            TotalPrice: totalUnitPrice.toFixed(2),
            VatRate: vatRate.toFixed(2),
            VatPrice: vatAmount.toFixed(2),
            NetPrice: totalUnitPriceWithVAT.toFixed(2),
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
            setIsUploaded(true); // Set isUploaded to true
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
            quotationId:quotation.quotationId,
            user: quotation.user?._id,  
            saleName:quotation.sale ? quotation.sale.name:'',
            clientName: quotation.client ? quotation.client.name : '', 
            projectName: quotation.projectName,
            projectLA:quotation.projectLA,
            products: quotation.products,
            paymentTerm:quotation.paymentTerm,
            paymentDelivery: quotation.paymentDelivery,
            note: quotation.note,
            excluding: quotation.excluding,
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
    return <div>Error loading approve: {error}</div>;
  }

  if (!quotation) {
    return null;
  }

  
 

  const addRow = () => {
    const newRow = { id: rows.length + 1, number: rows.length + 1 };
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
  
    try {
      await updateQuotationApprove({
        id: params.id,
        ...formData,
        products: rowInputs,
      });
      console.log("Update successful");
      setUpdateTrigger(prev => !prev); // Toggle to trigger re-fetch
    } catch (error) {
      console.error("Failed to update!", error);
    }
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

  const handleAdminChange = (e) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      user: e.target.value,
    }));
  };
  

  


  return (
    
    <div> 
      <form onSubmit={handleSubmit}>
        <div className={styles.container}>
        <div className={styles.container}>
        Quotation ID: {formData.quotationId}
       </div>
        <button type="button" className={styles.DownloadButton} onClick={downloadQuotationWordDocument}>
           Download Quotation WORD ...
           </button>
           <button type="button" className={styles.DownloadButton} onClick={downloadQuotationPdfDocument}>
           Download Quotation PDF...
           </button>
           <button type="button" className={styles.DownloadButton} onClick={uploadQuotationDocument} disabled={isUploaded}>
  {isUploaded ? 'Uploaded' : 'Upload Quotation to Synology'}
</button>
          <div className={styles.form1}>
            <input type="hidden" name="id" value={params.id} />
            <div className={styles.selectContainer}>        
            <div className={styles.inputContainer}>
        
            <label htmlFor="adminName" className={styles.label}>
                  Admin Name:
                </label>
                <select
              name='user'
              value={formData.user}
              onChange={handleAdminChange}>
            <option value="" disabled selected >Select An Admin</option>
            {users.filter(user => user.isAdmin).map(adminUser => (  
            <option key={adminUser._id} value={adminUser._id}>
            {adminUser.username}
          </option>
            ))}
      </select>
            </div>
            </div>
            <div className={styles.inputContainer}>
                <label htmlFor="saleName" className={styles.label}>
                sale Representative:
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
                <label htmlFor="projectName" className={styles.label}>
                  Project Name:
                </label>
            <input
              className={styles.input}
              value={formData.projectName}
              onChange={(e) => handleInputChange('projectName', e.target.value)}
              readOnly 
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
              readOnly 

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
                    {(Number(row.unitPrice) || 0).toFixed(2)}
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
          <p>Total Unit Price (Excluding VAT): {calculateTotalUnitPrice().totalUnitPrice}</p>
            <p>VAT (15%): {calculateTotalUnitPrice().vatAmount}</p>
            <p>Total Unit Price (Including VAT): {calculateTotalUnitPrice().totalUnitPriceWithVAT}</p>
          </div>
        </div>
        <div className={styles.container}>
          <div className={styles.form1}>
          <div className={styles.inputContainer}>
                <label htmlFor="adminName" className={styles.label}>
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
              value={formData.paymentDelivery}
              onChange={(e) => handleInputChange('paymentDelivery', e.target.value)}
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
            <button type="submit">Submit</button>

          </div>
        </div>
      </form>
    </div>
  );
  
};




export default SingleApprovePage
