"use client";
import React, {useState, useEffect} from 'react'; 
import { FaPlus, FaTrash } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import toast from 'react-hot-toast';
import styles from '@/app/ui/dashboard/approve/approve.module.css';
import { addPickList } from '@/app/lib/actions';

const AddPlPage = () => { 
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
  const router = useRouter();
  const selectedClientData = clientsWithInfo.find((client) => client._id === selectedClient);
  const selectedSaleData = sales.find((sale) => sale._id === selectedSale);
  const selectedJobOrderData = jobOrders.find((jobOrder) => jobOrder._id === selectedJobOrder);
  const canSubmit =
    !!selectedClient &&
    !!selectedSale &&
    !!selectedJobOrder &&
    rows.some((row) => row.productCode.trim() && row.description.trim() && Number(row.qty) > 0);

  const buildApiUrl = (path) => {
    const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
    return base ? `${base}${path}` : path;
  };


  useEffect(()=> {
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

    fetchClientsWithQuotations();
  }, []);

  const getClientLabel = (client) => {
    return String(client?.name || '');
  };

  const filteredClients = clientsWithInfo.filter((client) => {
    const query = clientSearch.trim().toLowerCase();
    if (!query) return true;
    const name = String(client?.name || '').toLowerCase();
    const quotationIds = Array.isArray(client?.quotations)
      ? client.quotations.map((quotation) => String(quotation?.quotationId || '').toLowerCase())
      : [];
    return name.includes(query) || quotationIds.some((quotationId) => quotationId.includes(query));
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

  const productSchema = z.object({
    number: z.number(),
    productCode: z.string().min(1, "Product code is required"),
    qty: z.coerce.number().positive("Quantity is required"),
    description: z.string().min(1, "Description is required"),
  });
  
  const pickListSchema = z.object({
    saleId: z.string().min(1, "Sales Representative is required"),
    clientId: z.string().min(1, "Client is required"),
    jobOrderId: z.string().min(1, "Job Order is required"),
    deliveryLocation: z.string().optional(),
    products: z.array(productSchema).min(1, "Add at least one product"),
  });
 
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
        i === index
          ? {
              ...row,
              [field]:
                field === 'qty'
                  ? value.replace(/[^\d.]/g, '')
                  : typeof value === 'string'
                  ? value.toUpperCase()
                  : value,
            }
          : row
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

  const handleJobOrderSearchChange = (value) => {
    setJobOrderSearch(value);
    const selectedOrder = jobOrders.find((order) => String(order?.jobOrderId || '') === value);
    const nextId = selectedOrder?._id || '';
    setSelectedJobOrder(nextId);
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

    const formValues = {
      clientId: selectedClient,
      saleId: selectedSale,
      jobOrderId: selectedJobOrder,
      deliveryLocation: locationValue === '' ? undefined : locationValue.toUpperCase(),
      products: rows.map((row, index) => ({
        number: index + 1,
        productCode: row.productCode.trim().toUpperCase(),
        qty: Number(row.qty),
        description: row.description.trim().toUpperCase(),
      })),
    };
  
    try {
      const validatedData = pickListSchema.parse(formValues);
      const result = await addPickList(validatedData);
      if (result?.success) {
        toast.success(`Pick list ${result.pickListId} created successfully!`);
      } else {
        toast.success('Pick list created successfully!');
      }
      router.push('/dashboard/pl_coc/pl');
    } catch (err) {
      if (err instanceof z.ZodError) {
        const firstMessage = err.errors[0]?.message || 'Validation failed';
        setError(firstMessage);
        err.errors.forEach((issue) => toast.error(issue.message));
      } else {
        const message = err.message || 'An error occurred while submitting the form.';
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
          <div className={styles.quoteHeader}>
            <span className={styles.quoteIdLabel}>Create Pick List</span>
            <span className={styles.quoteIdValue}>
              {selectedJobOrderData?.jobOrderId || "New"}
            </span>
          </div>
          <div className={styles.contextChips}>
            <span className={styles.contextChip}>
              Client: {selectedClientData?.name || "Not selected"}
            </span>
            <span className={styles.contextChip}>
              Sale: {selectedSaleData?.name || "Not selected"}
            </span>
            <span className={styles.contextChip}>
              Job Order: {selectedJobOrderData?.jobOrderId || "Not selected"}
            </span>
          </div>
          <div className={styles.form1}>
          <div className={styles.selectContainer}>                
          <div className={styles.inputContainer}>
          <label htmlFor="adminName" className={styles.label}>
                  Client Name:
                </label>
          <input
            type="text"
            className={styles.input}
            placeholder="Search Client..."
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
                Sale Representative Name:
                </label>
          <input
            type="text"
            className={styles.input}
            placeholder="Search Sale Representative..."
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
                Job Order ID:
                </label>
          <input
            type="text"
            className={styles.input}
            placeholder="Search Job Order..."
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
            <div className={styles.submitRow}>
              <button
                type="submit"
                className={styles.submitInlineButton}
                disabled={!canSubmit}
              >
                Create Pick List
              </button>
            </div>
          </div>
        </div>
        
      </form>
      )}
    </div>
  );
  
};

export default AddPlPage;
