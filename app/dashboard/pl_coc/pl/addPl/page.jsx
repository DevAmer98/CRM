"use client";
import React, {useState, useEffect} from 'react'; 
import { FaPlus, FaTrash } from 'react-icons/fa';
import styles from '@/app/ui/dashboard/approve/approve.module.css';
import { addPickList } from '@/app/lib/actions';

const AddPlPage = () => { 
  const [clientsWithInfo, setClientsWithInfo] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedQuotation, setSelectedQuotation] = useState('');
  const [sales, setSales] = useState([]);  
  const [jobOrders, setjobOrders] = useState([]);   
  const [rows, setRows] = React.useState([{ number: 1 }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const domain = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";


  useEffect(()=> {
  const fetchClientsWithQuotations = async () => {
    try {
      const response = await fetch(`${domain}/api/clientWithQuoAndPo`, {
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

  const renderClientOptions = () => (
    <>
      <option value="">Select Client</option>
      {clientsWithInfo.map((client) => (
        <option key={client._id.toString()} value={client._id.toString()}>
          {client.name}
        </option>
      ))}
    </>
  );

  const renderQuotationOptions = () => {
    const selectedClientData = clientsWithInfo.find(c => c._id === selectedClient);
   

    return (
      <>
        <option value="">Select Quotation</option>
        {selectedClientData?.quotations.map((quotation) => (
        <option key={quotation._id} value={quotation._id}>
        {quotation.projectName}
  </option>
))}
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
    const fetchJobOrder = async () => {
      try {
        const response = await fetch(`${domain}/api/allJobs`, { method: 'GET' });
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
        const response = await fetch(`${domain}/api/allSales`, { method: 'GET' });
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

 
  const addRow = () => {
    const newRow = { number: rows.length + 1 };
    const newRows = [...rows, newRow];
    setRows(newRows);
  };

  const deleteRow = (index) => { 
    const updatedRows = rows.filter((_, i) => i !== index);
    const updatedRowsWithNumbers = updatedRows.map((row, i) => ({ ...row, number: i + 1 }));
    setRows(updatedRowsWithNumbers);
  };

  

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log('Form submitted. FormData:', event.target);
  
    try {
      const formData = {
        clientId: event.target.clientId.value,
        quotationId: event.target.quotationId.value,
        saleId: event.target.saleId.value,
        jobOrderId: event.target.jobOrderId.value,
        deliveryLocation: event.target.deliveryLocation.value,
        products: rows.map((row, index) => ({
          number: index + 1,
          productCode: event.target[`productCode${index}`].value,
          qty: event.target[`qty${index}`].value,
          description: event.target[`description${index}`].value,
        })),
      };
  
      await addPickList(formData);
  
      // Reset error state if submission succeeds
      setError(null);
    } catch (error) {
      // Update error state if submission fails
      setError(error.message || 'An error occurred while submitting the form.');
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
          <select name='jobOrderId' className={styles.input}>
          <option value="" disabled selected>Select Job Orders</option>
          {jobOrders.map((jobOrder) => (
              <option key={jobOrder._id} value={jobOrder._id}>
                  {jobOrder.jobOrderId}
              </option>
            ))}
          </select>
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
                    <td><input type='text' name={`productCode${index}`} className={styles.input1} /></td>
                    <td><input type='number' name={`qty${index}`} className={styles.input1} /></td>
                    <td><textarea name={`description${index}`} className={`${styles.input1} ${styles.textarea}`}></textarea></td>
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

export default AddPlPage;

