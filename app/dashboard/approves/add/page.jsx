"use client";
import React, {useState, useEffect} from 'react'; 
import styles from '@/app/ui/dashboard/jobOrder/jobOrder.module.css';
import { addApprove } from '@/app/lib/actions';

 

const AddApproveQuo = () => {
  const [clientsWithInfo, setClientsWithInfo] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedQuotation, setSelectedQuotation] = useState('');
  const [sales, setSales] = useState([]); 
  const [users, setUsers] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const domain = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";


  

 
  useEffect(() => {
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


  useEffect(() => {
    const fetchSales= async () => {
      try {
        const response = await fetch(`${domain}/api/allSales`, { method: 'GET' });
        const data = await response.json();
        console.log('Sales fetched:', data);
        setSales(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        setLoading(false);
      }
    };
  
    fetchSales();
  }, []);
 
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
  

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedClient || !selectedQuotation) {
      console.error('Please select a client and a quotation.');
      return;
    }


    console.log('Form submitted. FormData:', event.target);
    const formData = {
      saleId: event.target.saleId.value, 
      userId: event.target.userId.value, 
      clientId: selectedClient,
      quotationId: selectedQuotation,
    };

    await addApprove(formData);
  };
  
 
  

  return (
    <div className={styles.wrapper}>
          <div className={styles.container}>
     {loading && <p>Loading clients...</p>}
    {error && <p>Error: {error}</p>}
    {!loading && !error && (
      <form onSubmit={handleSubmit} className={styles.form}>
        
          <select name='userId' >
        <option value="" disabled selected >Select An Admin</option>
        {users.filter(user => user.isAdmin).map(adminUser => (
          <option key={adminUser._id} value={adminUser._id}>
            {adminUser.username}
          </option>
        ))}
      </select>
          <select name='saleId'>
          <option value="" disabled selected>Select Sale Representative </option>
          {sales.map((sale) => (
              <option key={sale._id} value={sale._id}>
                  {sale.name}
              </option>
            ))}
          </select>
          <select name="clientId" onChange={handleClientChange} value={selectedClient}>
          {renderClientOptions()}
        </select>
        <select name="quotationId" onChange={handleQuotationChange} value={selectedQuotation}>
          {renderQuotationOptions()}
        </select>
            <button type="submit">Approve</button>
      </form>
      )}
    </div>
    </div>
  );
};

export default AddApproveQuo
