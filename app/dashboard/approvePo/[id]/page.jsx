"use client";
import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import styles from '@/app/ui/dashboard/approve/approve.module.css';
import { updatePurchaseOrderApproval } from '@/app/lib/actions';

 

const SingleApprovePo = ({params}) => {
  const [selectedCurrency, setSelectedCurrency] = useState('USD'); 
  const [purchaseOrder, setPurchaseOrder] = useState(null);
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
      deliveryLocation: '',
    });
    const [rows, setRows] = useState([]);
    const domain = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const [isUploaded, setIsUploaded] = useState(false); // Add this line to track upload status
    

  
        useEffect(() =>{
            const getApprovePoById = async () => {
                try {

                  const domain = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
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
  
          getApprovePoById();
        }, []);
        
        useEffect(() => {
          const fetchUsers= async () => {
            try {
              const domain = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
              const response = await fetch(`${domain}/api/allUsers`, { method: 'GET' });
              const data = await response.json();
              console.log('Users fetched:', data);
              setUsers(data);
              setLoading(false);
            } catch (error) {
              console.error('Error fetching users:', error);
              setLoading(false);
            }
          };
        
          fetchUsers();
        }, []);

  
        const downloadPurchaseOrderWordDocument = async () => {
          try {
            const totalUnitPrice = rows.reduce((total, row) => total + Number(row.unitPrice || 0), 0);
            const vatRate = selectedCurrency === 'USD' ? 0 : 0.15; // 0% VAT for USD, 15% for SAR
            const vatAmount = totalUnitPrice * vatRate;
            const totalUnitPriceWithVAT = totalUnitPrice + vatAmount;
  
            // Prepare the data for the document
            const documentData = {
              PurchaseId:purchaseOrder.purchaseId,
              QuotationNumber: purchaseOrder.quotation?.quotationId,
              SupplierId: purchaseOrder.supplier?.supplierId,
              SupplierName: purchaseOrder.supplier?.name, 
              userName: purchaseOrder.user?.username, 
              ClientContactMobile: purchaseOrder.client?.phone || 'No address provided',
              SupplierEmail: purchaseOrder.supplier?.email || 'No contact info',
              SupplierAddress: purchaseOrder.supplier?.address || 'No address info',
              SupplierContactMobile: purchaseOrder.supplier?.contactMobile || 'No contact info',
              SupplierContactName: purchaseOrder.supplier?.contactName || 'No contact info',
              SaleName: purchaseOrder.sale?.name || 'No address provided',
              SalePhone: purchaseOrder.sale?.phone || 'No address provided',
              SaleEmail: purchaseOrder.sale?.email || 'No contact info',
              SaleAddress: purchaseOrder.sale?.address || 'No address info',
              Products: purchaseOrder.products.map((product, index) => ({
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
              PaymentTerm:purchaseOrder.paymentTerm,
              PaymentDelivery: purchaseOrder.paymentDelivery,
              DeliveryLocation: purchaseOrder.deliveryLocation,
              Note: purchaseOrder.note,
              QuotationDate: purchaseOrder.quotation?.createdAt ? new Date(purchaseOrder.quotation?.createdAt).toDateString().slice(4, 16) : '',
              CreatedAt: purchaseOrder.createdAt ? new Date(purchaseOrder.createdAt).toDateString().slice(4, 16) : '',
            };
      
            const domain = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
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


        const downloadPurchaseOrderPdfDocument = async () => {
          try {
            const totalUnitPrice = rows.reduce((total, row) => total + Number(row.unitPrice || 0), 0);
            const vatRate = selectedCurrency === 'USD' ? 0 : 0.15; // 0% VAT for USD, 15% for SAR
            const vatAmount = totalUnitPrice * vatRate;
            const totalUnitPriceWithVAT = totalUnitPrice + vatAmount;
  
            // Prepare the data for the document
            const documentData = {
              PurchaseId:purchaseOrder.purchaseId,
              QuotationNumber: purchaseOrder.quotation?.quotationId,
              SupplierId: purchaseOrder.supplier?.supplierId,
              SupplierName: purchaseOrder.supplier?.name, 
              userName: purchaseOrder.user?.username, 
              ClientContactMobile: purchaseOrder.client?.phone || 'No address provided',
              SupplierEmail: purchaseOrder.supplier?.email || 'No contact info',
              SupplierAddress: purchaseOrder.supplier?.address || 'No address info',
              SupplierContactMobile: purchaseOrder.supplier?.contactMobile || 'No contact info',
              SupplierContactName: purchaseOrder.supplier?.contactName || 'No contact info',
              SaleName: purchaseOrder.sale?.name || 'No address provided',
              SalePhone: purchaseOrder.sale?.phone || 'No address provided',
              SaleEmail: purchaseOrder.sale?.email || 'No contact info',
              SaleAddress: purchaseOrder.sale?.address || 'No address info',
              Products: purchaseOrder.products.map((product, index) => ({
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
              PaymentTerm:purchaseOrder.paymentTerm,
              PaymentDelivery: purchaseOrder.paymentDelivery,
              DeliveryLocation: purchaseOrder.deliveryLocation,
              Note: purchaseOrder.note,
              QuotationDate: purchaseOrder.quotation?.createdAt ? new Date(purchaseOrder.quotation?.createdAt).toDateString().slice(4, 16) : '',
              CreatedAt: purchaseOrder.createdAt ? new Date(purchaseOrder.createdAt).toDateString().slice(4, 16) : '',
            };
      
            const domain = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
            const response = await fetch(`${domain}/api/loadPoPdf`, {
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
              link.download = `PO_${documentData.PurchaseId}.pdf`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            } else {
              throw new Error(`Server responded with status: ${response.status}`);}
               } catch (error) {
                console.error('Error downloading the document:', error);
            }
        };

        const uploadPoDocument = async () => {
          try {
          
        
            // Calculate totals
            const totalUnitPrice = rows.reduce((total, row) => total + Number(row.unitPrice || 0), 0);
            const vatRate = selectedCurrency === 'USD' ? 0 : 0.15; // 0% VAT for USD, 15% for SAR
            const vatAmount = totalUnitPrice * vatRate;
            const totalUnitPriceWithVAT = totalUnitPrice + vatAmount;
        
            // Prepare document data for upload
            const documentData = {
              PurchaseId:purchaseOrder.purchaseId,
              QuotationNumber: purchaseOrder.quotation?.quotationId,
              SupplierId: purchaseOrder.supplier?.supplierId,
              SupplierName: purchaseOrder.supplier?.name, 
              userName: purchaseOrder.user?.username, 
              ClientContactMobile: purchaseOrder.client?.phone || 'No address provided',
              SupplierEmail: purchaseOrder.supplier?.email || 'No contact info',
              SupplierAddress: purchaseOrder.supplier?.address || 'No address info',
              SupplierContactMobile: purchaseOrder.supplier?.contactMobile || 'No contact info',
              SupplierContactName: purchaseOrder.supplier?.contactName || 'No contact info',
              SaleName: purchaseOrder.sale?.name || 'No address provided',
              SalePhone: purchaseOrder.sale?.phone || 'No address provided',
              SaleEmail: purchaseOrder.sale?.email || 'No contact info',
              SaleAddress: purchaseOrder.sale?.address || 'No address info',
              Products: purchaseOrder.products.map((product, index) => ({
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
              PaymentTerm:purchaseOrder.paymentTerm,
              PaymentDelivery: purchaseOrder.paymentDelivery,
              DeliveryLocation: purchaseOrder.deliveryLocation,
              Note: purchaseOrder.note,
              QuotationDate: purchaseOrder.quotation?.createdAt ? new Date(purchaseOrder.quotation?.createdAt).toDateString().slice(4, 16) : '',
              CreatedAt: purchaseOrder.createdAt ? new Date(purchaseOrder.createdAt).toDateString().slice(4, 16) : '',
            };
        
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
          if (purchaseOrder) {
            setFormData({
              purchaseId: purchaseOrder.purchaseId,
              quotationId: purchaseOrder.quotation ? purchaseOrder.quotation.quotationId:'',
              user: purchaseOrder.user?._id,  
              saleName:purchaseOrder.sale ? purchaseOrder.sale.name:'',
              supplierName:purchaseOrder.sale ? purchaseOrder.supplier.name:'',
              deliveryLocation:purchaseOrder.deliveryLocation,
              products:purchaseOrder.products,
              paymentTerm:purchaseOrder.paymentTerm,
              paymentDelivery:purchaseOrder.paymentDelivery,
              note:purchaseOrder.note,
            });
      
            const newRows = purchaseOrder?.products.map((product, index) => ({
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
      return <div>Error loading approve: {error}</div>;
    }
  
    if (!purchaseOrder) {
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
  
      await updatePurchaseOrderApproval({
        id: params.id,
         ...formData,
        products: rowInputs,
      });
    };
  
    const calculateTotalUnitPrice = () => {
      const totalUnitPrice = rows.reduce((total, row) => total + (row.unitPrice || 0), 0);
      const vatRate = selectedCurrency === 'USD' ? 0 : 0.15; // 0% VAT for USD, 15% for SAR
      const totalUnitPriceWithVAT = totalUnitPrice * (1 + vatRate);
      return {
        totalUnitPrice,
        vatAmount: totalUnitPriceWithVAT - totalUnitPrice,
        totalUnitPriceWithVAT,
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
           Purchase Order ID: {formData.purchaseId}
          </div>
          <button type="button" className={styles.DownloadButton} onClick={downloadPurchaseOrderWordDocument}>
             Download Purchase Order WORD...
             </button>
             <button type="button" className={styles.DownloadButton} onClick={downloadPurchaseOrderPdfDocument}>
             Download Purchase Order PDF...
             </button>
             <button type="button" className={styles.DownloadButton} onClick={uploadPoDocument} disabled={isUploaded}>
  {isUploaded ? 'Uploaded' : 'Upload Purchase Order to Synology'}
</button>
            <div className={styles.form1}>
              <input type="hidden" name="id" value={params.id} />
              <div className={styles.inputContainer}>
              <div className={styles.selectContainer}>                
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
                Sale Representative Name:
                </label>
                <input
                  type="text"
                  id="saleName"
                  className={styles.input}
                  placeholder="Sale Name"
                  value={formData.saleName}
                  onChange={(e) => handleInputChange('saleName', e.target.value)}
                  readOnly 
                />
              </div>

              <div className={styles.inputContainer}>
                <label htmlFor="supplierName" className={styles.label}>
                  Supplier Name:
                </label>
                <input
                  type="text"
                  id="supplierName"
                  className={styles.input}
                  placeholder="Supplier Name"
                  value={formData.supplierName}
                  onChange={(e) => handleInputChange('supplierName', e.target.value)}
                  readOnly 
                />
              </div>
              <div className={styles.inputContainer}>
                <label htmlFor="supplierName" className={styles.label}>
                  Quotation Number:
                </label>
               <input
                type="text"
                className={styles.input}
                placeholder="quotationId"
                value={formData.quotationId}
                onChange={(e) => handleInputChange('quotationId', e.target.value)}
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
                      {row.unitPrice}                  
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
              <label htmlFor="note" className={styles.label}>
               Note:
                </label>
              <textarea
                className={styles.input}
                placeholder="note"
                value={formData.note}
                onChange={(e) => handleInputChange('note', e.target.value)}
              />
              </div>
              <div className={styles.inputContainer}>
              <label htmlFor="deliveryLocation" className={styles.label}>
               Delivey Location:
                </label>
              <textarea
                className={styles.input}
                value={formData.deliveryLocation}
                onChange={(e) => handleInputChange('deliveryLocation', e.target.value)}
              />
              </div>
              <button type="submit">Update</button>

            </div>
          </div>
        </form>
      </div>
    );
    
  };
  

export default SingleApprovePo