"use client";
import React, {useState, useEffect} from 'react'; 
import { FaPlus, FaTrash } from 'react-icons/fa';
import styles from '@/app/ui/dashboard/approve/approve.module.css';
import { addCoc } from '@/app/lib/actions';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';



  const productSchema = z.object({
    number: z.number(),
    productCode: z.string().min(1, "Product code is required"),
    qty: z.coerce.number().positive("Quantity is required"),
    description: z.string().min(1, "Description is required"),
  });
  
  const cocSchema = z.object({
    saleId: z.string().min(1, "Sale Representative is required"),
    clientId: z.string().min(1, "Client is required"),
    quotationId: z.string().min(1, "Quotation is required"),
    jobOrderId: z.string().min(1, "Job Order is required"),
    products: z.array(productSchema).min(1, "Add at least one product"),
    deliveryLocation: z.string().optional(),
  });



const AddCoc = () => {
      const router = useRouter();

  const [clientsWithInfo, setClientsWithInfo] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedQuotation, setSelectedQuotation] = useState('');
  const [sales, setSales] = useState([]); 
  const [jobOrders, setjobOrders] = useState([]); 
  const [rows, setRows] = React.useState([{ number: 1, productCode: '', qty: '', description: '' }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jobOrderProducts, setJobOrderProducts] = useState([]);
  const [selectedJobOrder, setSelectedJobOrder] = useState('');
  const buildApiUrl = (path) => {
    const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
    return base ? `${base}${path}` : path;
  };


  useEffect(() => { 
  const fetchClientsWithQuotations = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/clientWithQuoAndPo'), {
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
      {clientsWithInfo.map((client) => {
        const quotationIds = Array.isArray(client.quotations)
          ? client.quotations
              .map((quotation) => quotation?.quotationId)
              .filter(Boolean)
          : [];

        const suffix = quotationIds.length ? ` (${quotationIds.join(', ')})` : '';

        return (
          <option key={client._id.toString()} value={client._id.toString()}>
            {client.name}
            {suffix}
          </option>
        );
      })}
    </>
  );

  const renderQuotationOptions = () => {
    const selectedClientData = clientsWithInfo.find(c => c._id === selectedClient);
   

    return (
      <>
        <option value="">Select Quotation</option>
        {selectedClientData?.quotations.map((quotation) => {
          const labelParts = [
            quotation.quotationId,
            quotation.projectName && quotation.projectName !== quotation.quotationId
              ? quotation.projectName
              : null,
          ].filter(Boolean);

          return (
            <option key={quotation._id} value={quotation._id}>
              {labelParts.join(' - ')}
            </option>
          );
        })}
      </>
    );
  };

  const handleClientChange = (e) => {
    const newClient = e.target.value;
    setSelectedClient(newClient);
    setSelectedQuotation(''); 
  };

  const handleQuotationChange = (e) => {
    const newQuotation = e.target.value;
    setSelectedQuotation(newQuotation);
  }; 

 

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const response = await fetch(buildApiUrl('/api/allSales'), { method: 'GET' });
        const data = await response.json();
        console.log('Sales fetched:', data);
        setSales(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching sales:', error);
        setLoading(false);
      }
    };
  
    fetchSales();
  }, []);


  useEffect(() => {
    const fetchJobOrder = async () => {
      try {
        const response = await fetch(buildApiUrl('/api/allJobs'), { method: 'GET' });
        const data = await response.json();
        console.log('Purchase fetched:', data);
        setjobOrders(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching purchase:', error);
        setLoading(false);
      }
    };
  
    fetchJobOrder();
  }, []);


 
  const addRow = () => {
    setRows((prev) => {
      const nextRows = [
        ...prev,
        { number: prev.length + 1, productCode: '', qty: '', description: '' },
      ];
      return nextRows.map((row, idx) => ({ ...row, number: idx + 1 }));
    });
  };

  const deleteRow = (index) => { 
    setRows((prev) => {
      const updatedRows = prev.filter((_, i) => i !== index);
      if (!updatedRows.length) {
        return [{ number: 1, productCode: '', qty: '', description: '' }];
      }
      return updatedRows.map((row, i) => ({ ...row, number: i + 1 }));
    });
  };

  const handleRowChange = (index, field, value) => {
    setRows((prev) =>
      prev.map((row, i) =>
        i === index ? { ...row, [field]: field === 'qty' ? value.replace(/[^\d.]/g, '') : value } : row
      )
    );
  };

  const normalizeJobOrderProducts = (jobOrder) => {
    if (!jobOrder) return [];
    const fromJobOrder = Array.isArray(jobOrder.products) ? jobOrder.products : [];
    const fromQuotation = Array.isArray(jobOrder.quotation?.products) ? jobOrder.quotation.products : [];
    const source = fromJobOrder.length ? fromJobOrder : fromQuotation;
    return source.map((product) => ({
      productCode: product.productCode || '',
      description: product.description || '',
      qty: product.qty ?? '',
    }));
  };

  const handleJobOrderChange = (e) => {
    const newJobOrderId = e.target.value;
    setSelectedJobOrder(newJobOrderId);
    const selectedOrder = jobOrders.find((order) => order._id === newJobOrderId);
    setJobOrderProducts(normalizeJobOrderProducts(selectedOrder));
  };

  const handleSelectProduct = (product) => {
    setRows((prev) => {
      const alreadyAdded = prev.some(
        (row) =>
          row.productCode === (product.productCode || '') &&
          row.description === (product.description || '')
      );

      if (alreadyAdded) {
        toast.error('Product already added!');
        return prev;
      }

      const emptyIndex = prev.findIndex(
        (row) =>
          !row.productCode &&
          !row.description &&
          (row.qty === '' || row.qty === null || typeof row.qty === 'undefined')
      );

      if (emptyIndex !== -1) {
        const updatedRows = [...prev];
        updatedRows[emptyIndex] = {
          ...updatedRows[emptyIndex],
          productCode: product.productCode || '',
          description: product.description || '',
          qty: product.qty ?? '',
        };
        return updatedRows.map((row, idx) => ({ ...row, number: idx + 1 }));
      }

      const nextRows = [
        ...prev,
        {
          number: prev.length + 1,
          productCode: product.productCode || '',
          description: product.description || '',
          qty: product.qty ?? '',
        },
      ];
      return nextRows.map((row, idx) => ({ ...row, number: idx + 1 }));
    });
  };

  

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
 
    const locationValue = event.target.deliveryLocation.value.trim();

    const formData = {
      clientId: event.target.clientId.value,
      quotationId: event.target.quotationId.value,
      saleId: event.target.saleId.value,
      jobOrderId: event.target.jobOrderId.value,
      deliveryLocation: locationValue === '' ? undefined : locationValue,
      products: rows.map((row, index) => ({
        number: index + 1,
        productCode: row.productCode.trim(),
        qty: Number(row.qty),
        description: row.description.trim(),
      })),
    }; 

    try {
      const validatedData = cocSchema.parse(formData);
      const result = await addCoc(validatedData);
      if (result?.success) {
        toast.success(`Coc ${result.cocId} added successfully!`);
      } else {
        toast.success('Coc added successfully!');
      }
      router.push('/dashboard/pl_coc/coc');
    } catch (error) { 
      if (error instanceof z.ZodError) {
        const firstMessage = error.errors[0]?.message || 'Validation failed';
        setError(firstMessage);
        error.errors.forEach((err) => {
          toast.error(err.message);
        });
      } else if (error.message?.includes("already exists")) { 
        setError(error.message);
        toast.error(error.message);
      } else {
        const message = error.message || 'Failed to add Coc';
        setError(message);
        toast.error(message);
      }
    }
  };
  

  return (
    <div>
     {loading && <p>Loading clients...</p>}
      {error && <p>Error: {error}</p>}
      {!loading && !error && (
      <form onSubmit={handleSubmit}>
        <div className={styles.container}>
          <div className={styles.form1}>
          <div className={styles.selectContainer}>                
          <div className={styles.inputContainer}>
          <label htmlFor="adminName" className={styles.label}>
                  Client Name:
                </label>
          <select name="clientId" onChange={handleClientChange} value={selectedClient}>
          {renderClientOptions()}
        </select>
        </div>
          </div>
          <div className={styles.selectContainer}>                
          <div className={styles.inputContainer}>
          <label htmlFor="adminName" className={styles.label}>
                  Quotation Number:
                </label>
        <select name="quotationId" onChange={handleQuotationChange} value={selectedQuotation}>
          {renderQuotationOptions()}
          </select>
          </div>
          </div>

          <div className={styles.inputContainer}>
          <label htmlFor="saleId" className={styles.label}>
          Select Sales Representative:
                </label>
          <select name='saleId' className={styles.input}>
          <option value="" disabled selected>Select Sales Representative</option>
          {sales.map((sale) => (
              <option key={sale._id} value={sale._id}>
                  {sale.name}
              </option>
            ))}
          </select>
          </div>
          <div className={styles.inputContainer}>
          <label htmlFor="jobOrderId" className={styles.label}>
          Job Order Id:
                </label>
          <select
            name='jobOrderId'
            className={styles.input}
            value={selectedJobOrder}
            onChange={handleJobOrderChange}
          >
          <option value="" disabled>Select Job Orders</option>
          {jobOrders.map((jobOrder) => (
              <option key={jobOrder._id} value={jobOrder._id}>
                  {jobOrder.jobOrderId}
              </option>
            ))}
          </select>
          {jobOrderProducts.length > 0 && (
            <div className={styles.jobOrderTableContainer}>
              <p className={styles.title}>Job Order Products</p>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <td>#</td>
                    <td>Product Code</td>
                    <td>Description</td>
                    <td>Qty</td>
                    <td>Action</td>
                  </tr>
                </thead>
                <tbody>
                  {jobOrderProducts.map((product, index) => {
                    const isAdded = rows.some(
                      (row) =>
                        row.productCode === (product.productCode || '') &&
                        row.description === (product.description || '')
                    );
                    return (
                      <tr key={`${product.productCode}-${index}`}>
                        <td>{(index + 1).toString().padStart(3, '0')}</td>
                        <td>{product.productCode || '-'}</td>
                        <td>{product.description || '-'}</td>
                        <td>{product.qty || '-'}</td>
                        <td>
                          <button
                            type="button"
                            className={`${styles.selectButton} ${isAdded ? styles.DisabledButton : ''}`}
                            onClick={() => handleSelectProduct(product)}
                            disabled={isAdded}
                          >
                            {isAdded ? 'Added' : 'Add'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          </div>
          <div className={styles.inputContainer}>
          <label htmlFor="deliveryLocation" className={styles.label}>
                Delivery Location:
                </label>
          <input type='text' name='deliveryLocation' className={styles.input} placeholder='Delivery Location' />
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
                  <tr key={index} className={styles.row}>
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
                        type='text'
                        name={`productCode${index}`}
                        className={styles.input1}
                        value={row.productCode}
                        onChange={(e) => handleRowChange(index, 'productCode', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type='number'
                        name={`qty${index}`}
                        className={styles.input1}
                        value={row.qty}
                        onChange={(e) => handleRowChange(index, 'qty', e.target.value)}
                      />
                    </td>
                    <td>
                      <textarea
                        name={`description${index}`}
                        className={`${styles.input1} ${styles.textarea}`}
                        value={row.description}
                        onChange={(e) => handleRowChange(index, 'description', e.target.value)}
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

            <button type="submit">Submit</button>
          </div>
        </div>
        
      </form>
      )}
    </div>
  );
  
};

export default AddCoc;
