"use client"
import React, { useState, useEffect } from 'react';
import styles from '@/app/ui/dashboard/approve/approve.module.css';
import {  editPurchaseOrder, updatePurchaseOrder } from '@/app/lib/actions';
import { FaPlus, FaTrash } from 'react-icons/fa';

const SinglePurchasePage =({params}) => { 
  const [selectedCurrency, setSelectedCurrency] = useState('USD'); 
  const [purchaseOrder, setPurchaseOrder] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setLoading] = useState(true);
  const domain = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const [formData, setFormData] = useState({
    userProName:'',
    supplierName: '', 
    quotationNumber: '',
    products: [], 
    paymentTerm: '',
    deliveryLocation: '',
      deliveryTerm: '',
      sellingPolicy: '',
      validityPeriod:'',
      delayPenalties: '',
  });  
  const [rows, setRows] = useState([]);



    const calculateTotalPrice = () => {
  const totals = calculateTotalUnitPrice();
  return selectedCurrency === 'SAR'
    ? Number(totals.totalUnitPriceWithVAT)
    : Number(totals.totalUnitPrice);
};


  useEffect(() => {
    const getPurchaseById = async () => {
      try {
        const response = await fetch(`${domain}/api/purchaseOrder/${params.id}`,{
          method: "GET",
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setPurchaseOrder(data);
      } catch (err) {
        setError(`Fetching failed: ${err.message}`);
      } finally {
        setLoading(false);
      } 
    };
  
    getPurchaseById();
  }, [params.id]); // Include params.id as a dependency
  
  


  



      const downloadPurchaseWordDocument = async () => {
        try {
          const totalUnitPrice = rows.reduce((total, row) => total + Number(row.unitPrice || 0), 0);
          const vatRate = selectedCurrency === 'USD' ? 0 : 0.15; // 0% VAT for USD, 15% for SAR
          const vatAmount = totalUnitPrice * vatRate;
          const totalUnitPriceWithVAT = totalUnitPrice + vatAmount;
          const documentData = {
            PurchaseId: purchaseOrder.purchaseId, 
             username: purchaseOrder.userPro?.username || 'N/A',
          phone: purchaseOrder.userPro?.phone || 'No phone',
         email: purchaseOrder.userPro?.email || 'No email',
         address: purchaseOrder.userPro?.address || 'No address',
            JobOrderNumber: purchaseOrder.jobOrder?.jobOrderId,
            SupplierId: purchaseOrder.supplier?.supplierId,
            QuotationDate: purchaseOrder.jobOrder ? new Date(purchaseOrder.jobOrder.createdAt).toDateString().slice(4, 16) : '',
            SupplierName: purchaseOrder.supplier?.name, 
            SupplierPhone: purchaseOrder.supplier?.phone || 'No address provided',
            SupplierContactName: purchaseOrder.supplier?.contactName, 
            SupplierEmail: purchaseOrder.supplier?.email || 'No contact info',
            SupplierAddress: purchaseOrder.supplier?.address || 'No address info',
            SupplierContactMobile: purchaseOrder.supplier?.contactMobile || 'No contact info',
            SaleName: purchaseOrder.userPro?.username || 'No address provided',
            UserPhone: purchaseOrder.userPro?.phone || 'No address provided',
            UserEmail: purchaseOrder.userPro?.email || 'No contact info',
            UserAddress: purchaseOrder.userPro?.address || 'No address info',
            Products: formData.products.map((product, index) => ({
              Number: (index + 1).toString().padStart(3, '0'),
              ProductCode: product.productCode, 
            UnitPrice: Number(product.unitPrice).toFixed(2),
              Unit: Number(product.unit).toFixed(2),
              Qty: product.qty,
              Description: product.description,
            })),
            CurrencySymbol: selectedCurrency === 'USD' ? '$' : 'SAR', // Adjust this based on your requirements
            TotalPrice: totalUnitPrice.toFixed(2),
            VatRate: vatRate.toFixed(2),
            VatPrice: vatAmount.toFixed(2),
            NetPrice: totalUnitPriceWithVAT.toFixed(2),
            PaymentTerm: formData.paymentTerm,
            PaymentDelivery: formData.deliveryTerm,
            SellingPolicy: formData.sellingPolicy,
            DeliveryLocation: formData.deliveryLocation,
            ValidityPeriod: formData.validityPeriod,
            DelayPenalties: formData.delayPenalties,
            CreatedAt: purchaseOrder.createdAt ? new Date(purchaseOrder.createdAt).toDateString().slice(4, 16) : '',
          };
    
          // Send data to the server to create the document
          const response = await fetch(`${domain}/api/loadPoFile`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(documentData),
          });
    
          if (response.ok) {
            // Create a Blob from the PDF Stream
            const fileBlob = await response.blob();
            // Create a link element, use it to download the blob, and then remove it
            const link = document.createElement('a');
            link.href = URL.createObjectURL(fileBlob);
            link.download = `PO_${documentData.PurchaseId}.docx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } else {
            throw new Error(`Server responded with status: ${response.status}`);}
             } catch (error) {
              console.error('Error downloading the document:', error);
          }
      };




  

      useEffect(() => {
        if (purchaseOrder) {
          setFormData({
            purchaseId: purchaseOrder.purchaseId,
            userName: purchaseOrder.user && purchaseOrder.user.username ? purchaseOrder.user.username : 'N/A', 
            userProName: purchaseOrder.userPro && purchaseOrder.userPro.username ? purchaseOrder.userPro.username : 'N/A', 
            supplierName: purchaseOrder.supplier? purchaseOrder.supplier.name:'',
            jobOrderNumber: purchaseOrder.jobOrder? purchaseOrder.jobOrder.jobOrderId:'',
            products: purchaseOrder.products,
            paymentTerm: purchaseOrder.paymentTerm,
            deliveryLocation: purchaseOrder.deliveryLocation,
            deliveryTerm: purchaseOrder.deliveryTerm,
            sellingPolicy: purchaseOrder.sellingPolicy,
            deliveryLocation: purchaseOrder.deliveryLocation, 
            validityPeriod: purchaseOrder.validityPeriod,
            delayPenalties: purchaseOrder.delayPenalties, 
            currency: purchaseOrder.currency || 'USD',
totalPrice: calculateTotalPrice()
          });
        
        setSelectedCurrency(purchaseOrder.currency || 'USD'); // ✅ Load saved currency

          const newRows = purchaseOrder.products.map((product, index) => ({
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
      }, [purchaseOrder]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading purchase : {error}</div>;
  }

  if (!purchaseOrder) {
    // If not loading and no quotation, assume it's not found or yet to be loaded
    return null;
  }

  // State variables for form data and rows
  
 

  // Function to add a new row to the products table
  const addRow = () => {
    const newRow = { id: rows.length + 1, number: rows.length + 1 };
    setRows((prevRows) => [...prevRows, newRow]);
  };

  // Function to delete a row from the products table
  const deleteRow = (index) => {
    const updatedRows = rows.filter((_, i) => i !== index);
    const updatedRowsWithNumbers = updatedRows.map((row, i) => ({ ...row, number: i + 1 }));
    setRows(updatedRowsWithNumbers);
  };

  // Function to handle input change for each row
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

  // Function to handle input change for the main form
  const handleInputChange = (fieldName, value) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      [fieldName]: value,
    }));
  };

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const rowInputs = rows.map((row) => ({
      productCode: row.productCode,
      unitPrice: row.unitPrice,
      unit: row.unit,
      qty: row.qty,
      description: row.description,
    }));

    await updatePurchaseOrder({
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

     const payload = {
        id: params.id,
        ...formData,
        products: rowInputs,
        currency: selectedCurrency,
  totalPrice: calculateTotalPrice(),
   };
    
      console.log('Payload being sent:', payload); // Debugging line
    
      await editPurchaseOrder(payload);
  
    };




  const uploadPurchaseDocument = async () => {
    try {
          const totalUnitPrice = rows.reduce((total, row) => total + Number(row.unitPrice || 0), 0);
          const vatRate = selectedCurrency === 'USD' ? 0 : 0.15; // 0% VAT for USD, 15% for SAR
          const vatAmount = totalUnitPrice * vatRate;
          const totalUnitPriceWithVAT = totalUnitPrice + vatAmount;
          const documentData = {
            PurchaseId: purchaseOrder.purchaseId, 
             username: purchaseOrder.userPro?.username || 'N/A',
          phone: purchaseOrder.userPro?.phone || 'No phone',
         email: purchaseOrder.userPro?.email || 'No email',
         address: purchaseOrder.userPro?.address || 'No address',
            JobOrderNumber: purchaseOrder.jobOrder?.jobOrderId,
            SupplierId: purchaseOrder.supplier?.supplierId,
            QuotationDate: purchaseOrder.jobOrder ? new Date(purchaseOrder.jobOrder.createdAt).toDateString().slice(4, 16) : '',
            SupplierName: purchaseOrder.supplier?.name, 
            SupplierPhone: purchaseOrder.supplier?.phone || 'No address provided',
            SupplierContactName: purchaseOrder.supplier?.contactName, 
            SupplierEmail: purchaseOrder.supplier?.email || 'No contact info',
            SupplierAddress: purchaseOrder.supplier?.address || 'No address info',
            SupplierContactMobile: purchaseOrder.supplier?.contactMobile || 'No contact info',
            SaleName: purchaseOrder.userPro?.username || 'No address provided',
            UserPhone: purchaseOrder.userPro?.phone || 'No address provided',
            UserEmail: purchaseOrder.userPro?.email || 'No contact info',
            UserAddress: purchaseOrder.userPro?.address || 'No address info',
            Products: formData.products.map((product, index) => ({
              Number: (index + 1).toString().padStart(3, '0'),
              ProductCode: product.productCode, 
            UnitPrice: Number(product.unitPrice).toFixed(2),
              Unit: Number(product.unit).toFixed(2),
              Qty: product.qty,
              Description: product.description,
          })),
          TotalPrice: totalUnitPrice.toFixed(2),
          CurrencySymbol: selectedCurrency === 'USD' ? '$' : 'SAR',
      VatRate: vatRate.toFixed(2),
VatPrice: vatAmount.toFixed(2),
NetPrice: totalUnitPriceWithVAT.toFixed(2),
PaymentTerm: formData.paymentTerm,
deliveryTerm: formData.deliveryTerm,
SellingPolicy: formData.sellingPolicy,
DeliveryLocation: formData.deliveryLocation,
ValidityPeriod: formData.validityPeriod,
DelayPenalties: formData.delayPenalties,
CreatedAt: purchaseOrder.createdAt
  ? new Date(purchaseOrder.createdAt).toDateString().slice(4, 16)
  : ''
};  // ✅ Proper closing of documentData
  
      // Log document data for debugging
      console.log('Document Data for upload:', documentData);
  
      // Make POST request to upload PDF to Synology
      const response = await fetch(`${domain}/api/loadPoToSynology`, {
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
    <div >
         <form onSubmit={handleSubmit}>
        
        <div className={styles.container}>
        <div className={styles.container}>
      Purchase Order ID: {formData.purchaseId}
      </div> 
            <button
  type="button"
  className={`${styles.DownloadButton}`} 
  onClick={handleEdit}>
  Edit without Rev.
</button>
      <button
  type="button"
  className={`${styles.DownloadButton} ${formData.userName && formData.userName.trim() !== 'N/A' ? '' : styles.DisabledButton}`}
  onClick={uploadPurchaseDocument}
  disabled={!formData.userName || formData.userName.trim() === 'N/A'}
>
  Upload To Synology
</button>
        <button type="button"
        className={`${styles.DownloadButton} ${formData.userName && formData.userName.trim() !== 'N/A' ? '' : styles.DisabledButton}`}
         onClick={downloadPurchaseWordDocument}
         disabled={!formData.userName || formData.userName.trim() === 'N/A'}
         >
           Download Purchase Order
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
                <label htmlFor="username" className={styles.label}>
                  User Procurement Name:
                </label>
            <input
              type="text"
              className={styles.input}
              value={formData.userProName}
              onChange={(e) => handleInputChange('userProName', e.target.value)}
              readOnly 
            />
            </div>
            <div className={styles.inputContainer}>
                <label htmlFor="supplierName" className={styles.label}>
                Supplier Name:
                </label>
            <input
              className={styles.input}
              value={formData.supplierName}
              onChange={(e) => handleInputChange('supplierName', e.target.value)}
              readOnly
            />
            </div>
            <div className={styles.inputContainer}>
                <label htmlFor="jobOrderNumber" className={styles.label}>
                Job Order Number:
                </label>
            <input
              className={styles.input}
              value={formData.jobOrderNumber}
              onChange={(e) => handleInputChange('jobOrderNumber', e.target.value)}
              readOnly
            />
            </div>
            <div className={styles.inputContainer}>
                <label htmlFor="deliveryLocation" className={styles.label}>
                Delivery Location:
                </label>
            <input
              className={styles.input}
              value={formData.deliveryLocation}
              onChange={(e) => handleInputChange('deliveryLocation', e.target.value)}
            />
            </div>
          </div>
        </div>
        <div className={styles.container}>
          <div className={styles.form2}>
            <p className={styles.title}>Products</p>
            <div className={styles.selectContainer}>
            <div className={styles.selectWrapper}>
            <div className={styles.inputContainer}>
                <label htmlFor="paymentTerm" className={styles.label}>
                Select Currency:
                </label>
          <select
          id="currency"
          value={selectedCurrency}
          onChange={(e) => {
    setSelectedCurrency(e.target.value);
    setFormData(prev => ({ ...prev, currency: e.target.value })); // ✅ ADD THIS
  }}          
          className={styles.select}
          >
          <option value="USD">USD</option>
          <option value="SAR">SAR</option>
        </select>
        </div>
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
                        className={styles.input}
                        placeholder={row.productCode}
                        value={row.productCode}
                        onChange={(e) => handleRowInputChange(index, 'productCode', e.target.value)}
                      />
                    </td>
                    <td>
                    <textarea
                        className={`${styles.input} ${styles.textarea}`}
                        placeholder={row.description}
                        value={row.description}
                        onChange={(e) => handleRowInputChange(index, 'description', e.target.value)}
                      ></textarea>
                    </td>
                    <td>
                      <input
                        className={styles.input}
                        placeholder={row.qty}
                        value={row.qty}
                        onChange={(e) => handleRowInputChange(index, 'qty', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className={styles.input}
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
                <label htmlFor="paymentTerm" className={styles.label}>
                Payment Terms:
                </label>
            <textarea
              className={styles.input}
              value={formData.paymentTerm}
              onChange={(e) => handleInputChange('paymentTerm', e.target.value)}
            />
            </div>
            <div className={styles.inputContainer}>
                <label htmlFor="deliveryTerm" className={styles.label}>
                 Delivery Terms:
                </label>
            <textarea
              className={styles.input}
             value={formData.deliveryTerm}
onChange={(e) => handleInputChange('deliveryTerm', e.target.value)}

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
                <label htmlFor="delayPenalties" className={styles.label}>
                Delay Penalties:
                </label>
            <textarea
              className={styles.input}
              value={formData.delayPenalties}
              onChange={(e) => handleInputChange('delayPenalties', e.target.value)}
            />
            </div>
               <div className={styles.inputContainer}>
                <label htmlFor="sellingPolicy" className={styles.label}>
                Selling Policy:
                </label>
            <textarea
              className={styles.input}
              value={formData.sellingPolicy}
              onChange={(e) => handleInputChange('sellingPolicy', e.target.value)}
            />
            </div>
    
            <button type="submit">update</button>
          </div>
          
        </div>
      </form>
        </div>
    
  );
};

export default SinglePurchasePage