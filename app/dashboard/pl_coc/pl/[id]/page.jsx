"use client";
import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import styles from '@/app/ui/dashboard/approve/approve.module.css';
import { updatePl } from '@/app/lib/actions';



const SinglePl = ({params}) => {
  const [pl, setPl] = useState(null);
  const [error, setError] = useState(null); 
  const [isLoading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ 
    sale:'',
    clientName: '',  
    products: [],
  });
  const [rows, setRows] = useState([]);
  const domain = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";


  useEffect(() => {
    const getPlById = async () => {
      try {
        const response = await fetch(`${domain}/api/pl/${params.id}`,{
          method: "GET",
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setPl(data);
      } catch (err) {
        setError(`Fetching failed: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
  
    getPlById();
  }, [params.id]); // Include params.id as a dependency



  const uploadPlDocument = async () => {
    try {
        const documentData = {
            PickListNumber: pl.pickListId,
            DeliveryLocation: pl.deliveryLocation,
            ClientName: pl.client?.name, 
            ClientPhone: pl.client?.phone || 'No address provided',
            ClientEmail: pl.client?.email || 'No contact info',
            ClientAddress: pl.client?.address || 'No address info',
            ClientContactMobile: pl.client?.contactMobile || 'No contact info',
            ClientContactName: pl.client?.contactName || 'No contact info',
            SaleName: pl.sale?.name || 'No address provided',
            SalePhone: pl.sale?.phone || 'No address provided',
            SaleEmail: pl.sale?.email || 'No contact info',
            SaleAddress: pl.sale?.address || 'No address info',
            Products: formData.products.map((product, index) => ({
              Number: (index + 1).toString().padStart(3, '0'),
              ProductCode: product.productCode,
              Qty: product.qty,
              Description: product.description,
            })),
            CreatedAt: pl.createdAt ? new Date(pl.createdAt).toDateString().slice(4, 16) : '',
            PurchaseDate: pl.jobOrder?.poDate,
            PurchaseId: pl.jobOrder?.poNumber,
            JobOrderNumber: pl.jobOrder?.jobOrderId,
      };
  
      // Log document data for debugging
      console.log('Document Data for upload:', documentData);
  
      // Make POST request to upload PDF to Synology
      const response = await fetch(`${domain}/api/loadPlToSynology`, {
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


  
      

      /*const downloadQuotationDocument = async () => {
        try {
          const documentData = {
            PickListNumber: pl.pickListId,
            DeliveryLocation: pl.deliveryLocation,
            ClientName: pl.client?.name, 
            ClientPhone: pl.client?.phone || 'No address provided',
            ClientEmail: pl.client?.email || 'No contact info',
            ClientAddress: pl.client?.address || 'No address info',
            ClientContactMobile: pl.client?.contactMobile || 'No contact info',
            ClientContactName: pl.client?.contactName || 'No contact info',
            SaleName: pl.sale?.name || 'No address provided',
            SalePhone: pl.sale?.phone || 'No address provided',
            SaleEmail: pl.sale?.email || 'No contact info',
            SaleAddress: pl.sale?.address || 'No address info',
            Products: formData.products.map((product, index) => ({
              Number: (index + 1).toString().padStart(3, '0'),
              ProductCode: product.productCode,
              Qty: product.qty,
              Description: product.description,
            })),
            CreatedAt: pl.createdAt ? new Date(pl.createdAt).toDateString().slice(4, 16) : '',
            PurchaseDate: pl.jobOrder?.poDate,
            PurchaseId: pl.jobOrder?.poNumber,
            JobOrderNumber: pl.jobOrder?.jobOrderId,

          };
    
          // Send data to the server to create the document
          const response = await fetch('http://localhost:3000/api/loadPlData', {
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
            link.download = `PL_${documentData.PickListNumber}.docx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } else {
            throw new Error(`Server responded with status: ${response.status}`);}
             } catch (error) {
              console.error('Error downloading the document:', error);
          }
      };*/



      const downloadPlPdfDocument = async () => {
        try {
          const documentData = {
            PickListNumber: pl.pickListId,
            DeliveryLocation: pl.deliveryLocation,
            ClientName: pl.client?.name, 
            ClientPhone: pl.client?.phone || 'No address provided',
            ClientEmail: pl.client?.email || 'No contact info',
            ClientAddress: pl.client?.address || 'No address info',
            ClientContactMobile: pl.client?.contactMobile || 'No contact info',
            ClientContactName: pl.client?.contactName || 'No contact info',
            SaleName: pl.sale?.name || 'No address provided',
            SalePhone: pl.sale?.phone || 'No address provided',
            SaleEmail: pl.sale?.email || 'No contact info',
            SaleAddress: pl.sale?.address || 'No address info',
            Products: formData.products.map((product, index) => ({
              Number: (index + 1).toString().padStart(3, '0'),
              ProductCode: product.productCode,
              Qty: product.qty,
              Description: product.description,
            })),
            CreatedAt: pl.createdAt ? new Date(pl.createdAt).toDateString().slice(4, 16) : '',
            PurchaseDate: pl.jobOrder?.poDate,
            PurchaseId: pl.jobOrder?.poNumber,
            JobOrderNumber: pl.jobOrder?.jobOrderId,

          };
    
          // Send data to the server to create the document
          const response = await fetch(`${domain}/api/loadPlPdf`, {
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
            link.download = `PL_${documentData.PickListNumber}.pdf`;
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
        if (pl) {
          setFormData({
            pickListId: pl.pickListId,
            jobOrderId:pl.jobOrder? pl.jobOrder.jobOrderId:'',
            saleName:pl.sale ? pl.sale.name:'', 
            clientName: pl.client ? pl.client.name : '',
            deliveryLocation:pl.deliveryLocation,
            products: pl.products,
          });
    
          const newRows = pl.products.map((product, index) => ({
            _id: product._id,
            id: index + 1,
            number: index + 1,
            productCode: product.productCode,
            qty: product.qty,
            description: product.description,
          }));
          setRows(newRows);
        }
      }, [pl]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading coc: {error}</div>;
  }

  if (!pl) {
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

    await updatePl({
      id: params.id,
       ...formData,
      products: rowInputs,
    });
  };



  return ( 
    
    <div> 
      <form onSubmit={handleSubmit}>
        <div className={styles.container}>
        <div className={styles.container}>
        PickList ID: {formData.pickListId}
      </div>
        <button type="button" className={styles.DownloadButton} onClick={uploadPlDocument}>
           Upload to Synology 
           </button>
          <div className={styles.form1}>
          
            <input type="hidden" name="id" value={params.id} />
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
              readOnly 
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
            <input type='text' name='deliveryLocation' className={styles.input} placeholder={pl.deliveryLocation} />
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
  );
  
};




export default SinglePl;
