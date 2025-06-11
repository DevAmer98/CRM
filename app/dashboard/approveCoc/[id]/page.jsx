"use client";
import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import styles from '@/app/ui/dashboard/approve/approve.module.css';
import {updateCocApproval } from '@/app/lib/actions';



const SingleCocApprove = ({params}) => {
    const [coc, setCoc] = useState(null);
    const [users, setUsers] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
      sale:'',
      projectLA: '',
      products: [],
    });
    const [rows, setRows] = useState([]);
    const [isUploaded, setIsUploaded] = useState(false); 
    const domain = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

    

  
    useEffect(() => {
      const getCocById = async () => {
        try {
          const url = `${domain}/api/coc/${params.id}`;
          const response = await fetch(url, {
            method: "GET",
          });
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          setCoc(data);
        } catch (err) {
          setError(`Fetching failed: ${err.message}`);
          console.error(`Error loading coc: ${err.message}`); // Log the error message
        } finally {
          setLoading(false);
        }
      };
    
      getCocById();
    }, []);
    


        useEffect(() => {
            const fetchUsers= async () => {
              try {
                const domain = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
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

          const uploadCocDocument = async () => {
            try {
                const documentData = {
                CocNumber: coc.cocId,
                DeliveryLocation: coc.deliveryLocation,
                ProjectName: coc.jobOrder?.quotation?.projectName,
                ClientName: coc.client?.name, 
                userName: coc.user?.username, 
                ClientPhone: coc.client?.phone || 'No address provided',
                ClientEmail: coc.client?.email || 'No contact info',
                ClientAddress: coc.client?.address || 'No address info',
                ClientContactMobile: coc.client?.contactMobile || 'No contact info',
                ClientContactName: coc.client?.contactName || 'No contact info',
                SaleName: coc.sale?.name || 'No address provided',
                SalePhone: coc.sale?.phone || 'No address provided',
                SaleEmail: coc.sale?.email || 'No contact info',
                SaleAddress: coc.sale?.address || 'No address info',
                Products: formData.products.map((product, index) => ({
                  Number: (index + 1).toString().padStart(3, '0'),
                  ProductCode: product.productCode,
                  Qty: product.qty,
                  Description: product.description,
                })),
                CreatedAt: coc.createdAt ? new Date(coc.createdAt).toDateString().slice(4, 16) : '',
                PurchaseDate: coc.jobOrder?.poDate,
                PurchaseId: coc.jobOrder?.poNumber,
                JobOrderNumber: coc.jobOrder?.jobOrderId,
              };
          
              // Log document data for debugging
              console.log('Document Data for upload:', documentData);
          
              // Make POST request to upload PDF to Synology
              const response = await fetch(`${domain}/api/loadCocToSynology`, {
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
        
  
        const downloadCocWordDocument = async () => {
          try {
            // Prepare the data for the document
            const documentData = {
              CocNumber: coc.cocId,
              DeliveryLocation: coc.deliveryLocation,
              ProjectName: coc.jobOrder?.quotation?.projectName,
              ClientName: coc.client?.name, 
              userName: coc.user?.username, 
              ClientPhone: coc.client?.phone || 'No address provided',
              ClientEmail: coc.client?.email || 'No contact info',
              ClientAddress: coc.client?.address || 'No address info',
              ClientContactMobile: coc.client?.contactMobile || 'No contact info',
              ClientContactName: coc.client?.contactName || 'No contact info',
              SaleName: coc.sale?.name || 'No address provided',
              SalePhone: coc.sale?.phone || 'No address provided',
              SaleEmail: coc.sale?.email || 'No contact info',
              SaleAddress: coc.sale?.address || 'No address info',
              Products: formData.products.map((product, index) => ({
                Number: (index + 1).toString().padStart(3, '0'),
                ProductCode: product.productCode,
                Qty: product.qty,
                Description: product.description,
              })),
              CreatedAt: coc.createdAt ? new Date(coc.createdAt).toDateString().slice(4, 16) : '',
              PurchaseDate: coc.jobOrder?.poDate,
              PurchaseId: coc.jobOrder?.poNumber,
              JobOrderNumber: coc.jobOrder?.jobOrderId,
            };
      
            const domain = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
            const response = await fetch(`${domain}/api/loadCocFile`, {
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
              link.download = `Coc_${documentData.CocNumber}.docx`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            } else {
              throw new Error(`Server responded with status: ${response.status}`);}
               } catch (error) {
                console.error('Error downloading the document:', error);
            }
        };

        const downloadCocPdfDocument = async () => {
            try {
              // Prepare the data for the document
              const documentData = {
                CocNumber: coc.cocId,
                ProjectName: coc.jobOrder?.quotation?.projectName,
                DeliveryLocation: coc.deliveryLocation,
                ClientName: coc.client?.name, 
                userName: coc.user?.username, 
                ClientPhone: coc.client?.phone || 'No address provided',
                ClientEmail: coc.client?.email || 'No contact info',
                ClientAddress: coc.client?.address || 'No address info',
                ClientContactMobile: coc.client?.contactMobile || 'No contact info',
                ClientContactName: coc.client?.contactName || 'No contact info',
                SaleName: coc.sale?.name || 'No address provided',
                SalePhone: coc.sale?.phone || 'No address provided',
                SaleEmail: coc.sale?.email || 'No contact info',
                SaleAddress: coc.sale?.address || 'No address info',
                Products: formData.products.map((product, index) => ({
                  Number: (index + 1).toString().padStart(3, '0'),
                  ProductCode: product.productCode,
                  Qty: product.qty,
                  Description: product.description,
                })),
                CreatedAt: coc.createdAt ? new Date(coc.createdAt).toDateString().slice(4, 16) : '',
                PurchaseDate: coc.jobOrder?.poDate,
                PurchaseId: coc.jobOrder?.poNumber,
                JobOrderNumber: coc.jobOrder?.jobOrderId,
              };
        
              const domain = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
              const response = await fetch(`${domain}/api/loadCocPdf`, {
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
                link.download = `Coc_${documentData.CocNumber}.pdf`;
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
          if (coc) {
            setFormData({
              cocId:coc.cocId,
              clientName: coc.client ? coc.client.name : '',
              user: coc.user?._id,  
              jobOrderId:coc.jobOrder? coc.jobOrder.jobOrderId:'',
              saleName:coc.sale ? coc.sale.name:'', 
              deliveryLocation:coc.deliveryLocation,
              products: coc.products,
            });
      
            const newRows = coc.products.map((product, index) => ({
              _id: product._id,
              id: index + 1,
              number: index + 1,
              productCode: product.productCode,
              qty: product.qty,
              description: product.description,
            }));
            setRows(newRows);
          }
        }, [coc]);
  
    if (isLoading) {
      return <div>Loading...</div>;
    }
  
    if (error) {
      return <div>Error loading coc: {error}</div>;
    }
  
    if (!coc) {
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
          i === index ? { ...row, [fieldName]: value } : row
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
        qty: row.qty,
        description: row.description,
      }));
  
      await updateCocApproval({
        id: params.id,
         ...formData,
        products: rowInputs,
      });
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
              Coc ID: {formData.cocId}
            </div>
              <button type="button" className={styles.DownloadButton} onClick={downloadCocWordDocument}>
                 Download Word
                 </button>
                 <button type="button" className={styles.DownloadButton} onClick={downloadCocPdfDocument}>
                 Download Pdf
                 </button>
                 <button type="button" className={styles.DownloadButton} onClick={uploadCocDocument} disabled={isUploaded}>
                 {isUploaded ? 'Uploaded' : 'Upload Coc to Synology'}                 
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
                      <label htmlFor="clientName" className={styles.label}>
                      Client Name:
                      </label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Client Name"
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
                    className={styles.input}
                    placeholder="Sale Representative Name"
                    value={formData.saleName}
                    onChange={(e) => handleInputChange('saleName', e.target.value)}
                  />
                  </div>
                  <div className={styles.inputContainer}>
                      <label htmlFor="jobOrderId" className={styles.label}>
                      JobOrder Id:
                      </label>
                  <input
                    className={styles.input}
                    placeholder="Job Order"
                    value={formData.jobOrderId}
                    onChange={(e) => handleInputChange('jobOrderId', e.target.value)}
                    readOnly
                  />
                  </div>
                  <div className={styles.inputContainer}>
                      <label htmlFor="deliveryLocation" className={styles.label}>
                      Delivery Location:
                      </label>
                  <input type='text' name='deliveryLocation' className={styles.input} placeholder={coc.deliveryLocation} />
                  </div>
                </div>
              </div>
              <div className={styles.container}>
                <div className={styles.form2}>
                  <p className={styles.title}>Products</p>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <td>Number</td>
                        <td>Product Code</td>
                        <td>Qty</td>
                        <td>Description</td>
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
                            <input
                              className={styles.input1}
                              placeholder={row.qty}
                              value={row.qty}
                              onChange={(e) => handleRowInputChange(index, 'qty', e.target.value)}
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
                <div className={styles.form1}>
                  <button type="submit">Update</button>
                </div>
              </div>
            </form>
          </div>
        
      
      
      
      
      
  )
}

export default SingleCocApprove