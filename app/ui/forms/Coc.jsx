//app/ui/forms/Coc.jsx
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
    quotationId: z.string().optional(),
    jobOrderId: z.string().min(1, "Job Order is required"),
    projectReference: z.string().optional(),
    projectAddress: z.string().optional(),
    products: z.array(productSchema).min(1, "Add at least one product"),
  });



const AddCoc = () => {
      const router = useRouter();

  const [clientsWithInfo, setClientsWithInfo] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [sales, setSales] = useState([]); 
  const [selectedSale, setSelectedSale] = useState('');
  const [saleSearch, setSaleSearch] = useState('');
  const [jobOrders, setjobOrders] = useState([]); 
  const [jobOrderSearch, setJobOrderSearch] = useState('');
  const [rows, setRows] = React.useState([{ number: 1, productCode: '', qty: '', description: '' }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jobOrderProducts, setJobOrderProducts] = useState([]);
  const [selectedJobOrder, setSelectedJobOrder] = useState('');
  const [projectReference, setProjectReference] = useState('');
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

  const getClientLabel = (client) => {
    const quotationIds = Array.isArray(client?.quotations)
      ? client.quotations.map((quotation) => quotation?.quotationId).filter(Boolean)
      : [];
    const suffix = quotationIds.length ? ` (${quotationIds.join(', ')})` : '';
    return `${client?.name || ''}${suffix}`;
  };

  const filteredClients = clientsWithInfo.filter((client) => {
    const query = clientSearch.trim().toLowerCase();
    if (!query) return true;
    const clientName = String(client?.name || '').toLowerCase();
    const quotationIds = Array.isArray(client?.quotations)
      ? client.quotations.map((quotation) => String(quotation?.quotationId || '').toLowerCase())
      : [];
    return clientName.includes(query) || quotationIds.some((quotationId) => quotationId.includes(query));
  });

  const filteredSales = sales.filter((sale) => {
    const query = saleSearch.trim().toLowerCase();
    if (!query) return true;
    const name = String(sale?.name || '').toLowerCase();
    const email = String(sale?.email || '').toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  const filteredJobOrders = jobOrders.filter((jobOrder) => {
    const query = jobOrderSearch.trim().toLowerCase();
    if (!query) return true;
    const jobOrderId = String(jobOrder?.jobOrderId || '').toLowerCase();
    return jobOrderId.includes(query);
  });

  const handleClientSearchChange = (value) => {
    setClientSearch(value);
    const matchedClient = clientsWithInfo.find((client) => getClientLabel(client) === value);
    setSelectedClient(matchedClient?._id || '');
  };

  const handleSaleSearchChange = (value) => {
    setSaleSearch(value);
    const matchedSale = sales.find((sale) => String(sale?.name || '') === value);
    setSelectedSale(matchedSale?._id || '');
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

  const getProjectReferenceFromOrder = (jobOrder) => {
    const quotationRef = jobOrder?.quotation;
    if (!quotationRef) return '';
    if (typeof quotationRef === 'object') {
      return quotationRef.quotationId || quotationRef.projectName || '';
    }
    return String(quotationRef);
  };

  const handleJobOrderSearchChange = (value) => {
    setJobOrderSearch(value);
    const selectedOrder = jobOrders.find((order) => String(order?.jobOrderId || '') === value);
    const nextId = selectedOrder?._id || '';
    setSelectedJobOrder(nextId);
    setProjectReference(getProjectReferenceFromOrder(selectedOrder));
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
 
    const addressValue = event.target.projectAddress.value.trim();
    const selectedOrder = jobOrders.find((order) => order._id === selectedJobOrder);
    const quotationRef = selectedOrder?.quotation;
    const derivedQuotationId =
      (typeof quotationRef === 'object'
        ? quotationRef?._id?.toString?.()
        : quotationRef?.toString?.()) || '';

    const formData = {
      clientId: selectedClient,
      quotationId: derivedQuotationId || undefined,
      saleId: selectedSale,
      jobOrderId: selectedJobOrder,
      projectReference: projectReference.trim() === '' ? undefined : projectReference.trim(),
      projectAddress: addressValue === '' ? undefined : addressValue,
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
          <input
            type="text"
            className={styles.input}
            placeholder="Search client..."
            value={clientSearch}
            onChange={(e) => handleClientSearchChange(e.target.value)}
            list="client-options"
          />
          <datalist id="client-options">
            {filteredClients.map((client) => (
              <option key={client._id} value={getClientLabel(client)} />
            ))}
          </datalist>
          <input type="hidden" name="clientId" value={selectedClient} />
        </div>
          </div>

          <div className={styles.inputContainer}>
          <label htmlFor="saleId" className={styles.label}>
          Select Sales Representative:
                </label>
          <input
            type="text"
            className={styles.input}
            placeholder="Search sales representative..."
            value={saleSearch}
            onChange={(e) => handleSaleSearchChange(e.target.value)}
            list="sales-options"
          />
          <datalist id="sales-options">
            {filteredSales.map((sale) => (
              <option key={sale._id} value={sale.name || ''} />
            ))}
          </datalist>
          <input type="hidden" name="saleId" value={selectedSale} />
          </div>
          <div className={styles.inputContainer}>
          <label htmlFor="jobOrderId" className={styles.label}>
          Job Order Id:
                </label>
          <input
            type="text"
            className={styles.input}
            placeholder="Search job order..."
            value={jobOrderSearch}
            onChange={(e) => handleJobOrderSearchChange(e.target.value)}
            list="job-order-options"
          />
          <datalist id="job-order-options">
            {filteredJobOrders.map((jobOrder) => (
              <option key={jobOrder._id} value={jobOrder.jobOrderId || ''} />
            ))}
          </datalist>
          <input type="hidden" name="jobOrderId" value={selectedJobOrder} />
          <div className={styles.inputContainer}>
            <label htmlFor="projectReference" className={styles.label}>
              Project Reference:
            </label>
            <input
              type="text"
              name="projectReference"
              className={styles.input}
              value={projectReference}
              placeholder="Project Reference"
              readOnly
            />
          </div>
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
          <label htmlFor="projectAddress" className={styles.label}>
                Project Address:
                </label>
          <input type='text' name='projectAddress' className={styles.input} placeholder='Project Address' />
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
