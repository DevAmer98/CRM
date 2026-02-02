//app/dashboard/pl_coc/coc/[id]/page.jsx
"use client";
import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import styles from '@/app/ui/dashboard/approve/approve.module.css';
import { updateCoc } from '@/app/lib/actions';


 
const SingleCoc = ({params}) => {
  const [coc, setCoc] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    cocId: '',
    userName: '',
    projectName: '',
    clientName: '',
    jobOrderId: '',
    saleName: '',
    deliveryLocation: '',
    products: [],
  });
  const [rows, setRows] = useState([]);
  const domain = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";



  useEffect(() => {
    const getCocById = async () => {
      try {
        const response = await fetch(`${domain}/api/coc/${params.id}`,{
          method: "GET",
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setCoc(data);
      } catch (err) {
        setError(`Fetching failed: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
  
    getCocById();
  }, [params.id]); // <-- Add params.id as a dependency
  
  const buildCocDocumentData = () => {
    if (!coc) return null;

    return {
      CocNumber: coc.cocId || '',
      ProjectName: coc.quotation?.projectName || '',
      DeliveryLocation: coc.deliveryLocation || '',
      ClientName: coc.client?.name || '',
      userName: coc.user?.username || '',
      ClientPhone: coc.client?.phone || '',
      ClientEmail: coc.client?.email || '',
      ClientAddress: coc.client?.address || '',
      ClientContactMobile: coc.client?.contactMobile || '',
      ClientContactName: coc.client?.contactName || '',
      SaleName: coc.sale?.name || '',
      SalePhone: coc.sale?.phone || '',
      SaleEmail: coc.sale?.email || '',
      SaleAddress: coc.sale?.address || '',
      Products: rows.map((product, index) => ({
        Number: (index + 1).toString().padStart(3, '0'),
        ProductCode: product.productCode || '',
        Qty: product.qty || '',
        Description: product.description || '',
      })),
      CreatedAt: coc.createdAt ? new Date(coc.createdAt).toDateString().slice(4, 16) : '',
      PurchaseDate: coc.jobOrder?.poDate || '',
      PurchaseId: coc.jobOrder?.poNumber || '',
      JobOrderNumber: coc.jobOrder?.jobOrderId || '',
    };
  };

  const downloadCocPdfDocument = async () => {
    try {
      const documentData = buildCocDocumentData();
      if (!documentData) {
        alert('Certificate of Conformity data is loading. Please try again shortly.');
        return;
      }

      const response = await fetch(`${domain}/api/loadCocPdf`, {
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
        link.download = `Coc_${documentData.CocNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        throw new Error(`Server responded with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error downloading the document:', error);
    }
  };

  const downloadCocDocxDocument = async () => {
    try {
      const documentData = buildCocDocumentData();
      if (!documentData) {
        alert('Certificate of Conformity data is loading. Please try again shortly.');
        return;
      }

      const response = await fetch(`${domain}/api/loadCocFile`, {
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
        link.download = `Coc_${documentData.CocNumber}.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        throw new Error(`Server responded with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error downloading the document:', error);
    }
  };

  const previewCocPdfDocument = async () => {
    try {
      const documentData = buildCocDocumentData();
      if (!documentData) {
        alert('Certificate of Conformity data is loading. Please try again shortly.');
        return;
      }

      const response = await fetch(`${domain}/api/loadCocPdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(documentData),
      });

      if (response.ok) {
        const fileBlob = await response.blob();
        const fileURL = URL.createObjectURL(fileBlob);
        const newWindow = window.open(fileURL, '_blank');

        if (!newWindow) {
          alert('Please allow pop-ups in your browser to preview the PDF.');
          URL.revokeObjectURL(fileURL);
          return;
        }

        setTimeout(() => {
          URL.revokeObjectURL(fileURL);
        }, 60 * 1000);
      } else {
        throw new Error(`Server responded with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error generating the preview:', error);
    }
  };
             
   

  

      useEffect(() => {
        if (coc) {
          setFormData({
            cocId: coc.cocId || '',
            userName: coc.user?.username || '',
            projectName: coc.jobOrder?.quotatopn?.projectName || '',
            clientName: coc.client ? coc.client.name : '',
            jobOrderId: coc.jobOrder?.jobOrderId || '',
            saleName: coc.sale?.name || '', 
            deliveryLocation: coc.deliveryLocation || '',
            products: coc.products || [],
          });
    
          const newRows = (coc.products || []).map((product, index) => ({
            _id: product._id,
            id: index + 1,
            number: index + 1,
            productCode: product.productCode || '',
            qty: product.qty || '',
            description: product.description || '',
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
    const newRow = { id: rows.length + 1, number: rows.length + 1, productCode: '', qty: '', description: '' };
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
      productCode: row.productCode || '',
      qty: row.qty || '',
      description: row.description || '',
    }));

    await updateCoc({
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
        Coc ID: {formData.cocId || ''}
      </div>
        <div className={styles.buttonRow}>
          <button
            type="button"
            className={`${styles.DownloadButton} ${formData.userName?.trim() ? '' : styles.DisabledButton}`}
            onClick={previewCocPdfDocument}
            disabled={!formData.userName?.trim()}
          >
            Preview PDF
          </button>
          <button
            type="button"
            className={`${styles.DownloadButton} ${formData.userName?.trim() ? '' : styles.DisabledButton}`}
            onClick={downloadCocDocxDocument}
            disabled={!formData.userName?.trim()}
          >
            Download DOCX
          </button>
          <button type="button" 
          className={`${styles.DownloadButton} ${formData.userName?.trim() ? '' : styles.DisabledButton}`}
          onClick={downloadCocPdfDocument}
          disabled={!formData.userName?.trim()}
          >
             Download PDF
             </button>
        </div>
           
          <div className={styles.form1}>
            <input type="hidden" name="id" value={params.id} />
            <div className={styles.inputContainer}>
                <label htmlFor="username" className={styles.label}>
                  Admin Name:
                </label>
            <input
              type="text"
              className={styles.input}
              value={formData.userName || ''}
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
              placeholder="Client Name"
              value={formData.clientName || ''}
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
              value={formData.saleName || ''}
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
              value={formData.jobOrderId || ''}
              onChange={(e) => handleInputChange('jobOrderId', e.target.value)}
              readOnly
            />
            </div>
            <div className={styles.inputContainer}>
                <label htmlFor="deliveryLocation" className={styles.label}>
                Delivery Location:
                </label>
            <input
              type="text"
              name="deliveryLocation"
              className={styles.input}
              value={formData.deliveryLocation || ''}
              onChange={(e) => handleInputChange('deliveryLocation', e.target.value)}
            />
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
                        placeholder={row.productCode || ''}
                        value={row.productCode || ''}
                        onChange={(e) => handleRowInputChange(index, 'productCode', e.target.value)}
                      />
                    </td>

                 
                    <td>
                      <input
                        className={styles.input1}
                        placeholder={row.qty || ''}
                        value={row.qty || ''}
                        onChange={(e) => handleRowInputChange(index, 'qty', e.target.value)}
                      />
                    </td>
                    <td>
                      <textarea
                        className={`${styles.input1} ${styles.textarea}`}
                        placeholder={row.description || ''}
                        value={row.description || ''}
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




export default SingleCoc;
