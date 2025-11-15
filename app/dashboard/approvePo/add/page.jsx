"use client";
import React, {useState, useEffect} from 'react'; 
import styles from '@/app/ui/dashboard/jobOrder/jobOrder.module.css';
import { addPoApprove } from '@/app/lib/actions';
import { isAdminRole } from "@/app/lib/isAdminRole";

 

const AddApprovePo = () => {
  const [suppliersWithInfo, setSuppliersWithInfo] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(''); 
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState('');
  const [quotations, setQuotations] = useState([]); 
  const [sales, setSales] = useState([]); 
  const [users, setUsers] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const domain = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";


  useEffect(()=>{
  const fetchSuppliersWithPurchaseOrders = async () => {
    try {
      const response = await fetch(`${domain}/api/supplierWithPo`, {
        method: "POST"
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched data:', data);  
        const simplifiedData = data.suppliersWithPurchaseOrders.map(supplier => ({
          ...supplier,
          _id: supplier._id.toString(),
          purchaseOrders: supplier.purchaseOrders.map(purchase => ({
            ...purchase,
            _id: purchase._id.toString()
          }))
        }));
        console.log('Simplified data:', simplifiedData);  
        setSuppliersWithInfo(JSON.parse(JSON.stringify(simplifiedData)));
      } else {
        console.error('Failed to fetch suppliers with purchaseOrders');
      }
    } catch (error) {
      console.error('Error fetching suppliers with purchaseOrders:', error);
    }
  };

  
    fetchSuppliersWithPurchaseOrders();
  }, []);


  const renderSupplierOptions = () => (
    <>
      <option value="">Select Supplier</option>
      {suppliersWithInfo.map((supplier) => (
        <option key={supplier._id.toString()} value={supplier._id.toString()}>
          {supplier.name}
        </option>
      ))}
    </>
  );


    useEffect(() => { 
      const fetchUserPro = async () => {
        try {
          const response = await fetch(`${domain}/api/allUserPro`, { method: 'GET' });
          const data = await response.json();
          console.log('user pro fetched:', data);
          setUserPro(data);
          setLoading(false);
        } catch (error) {
          console.error('Error fetching user pro:', error);
          setLoading(false);
        }
      };
    
      fetchUserPro();
    }, []);
  


 
 
  useEffect(() => {
    const fetchUsers= async () => {
      try {
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




  const renderPurchaseOptions = () => {
    const selectedSupplierData = suppliersWithInfo.find(c => c._id === selectedSupplier);
   

    return (
      <>
        <option value="">Select Purchase Order</option>
        {selectedSupplierData?.purchaseOrders.map((purchase) => (
        <option key={purchase._id} value={purchase._id}>
        {purchase.purchaseId}
  </option>
))}
      </>
    );
  };

  const handleSupplierChange = (e) => {
    const newSupplier = e.target.value;
    setSelectedSupplier(newSupplier);
    setSelectedPurchaseOrder(''); 
  };

  const handlePurchaseOrderChange = (e) => {
    const newPurchase = e.target.value;
    setSelectedPurchaseOrder(newPurchase);
  };
  

  

  const handleSubmit = async (event) => {
    event.preventDefault();


    if (!selectedSupplier || !selectedPurchaseOrder) {
      console.error('Please select a supplier and a purchaseOrder.');
      return;
    }
    console.log('Form submitted. FormData:', event.target);
    const formData = {
      saleId: event.target.saleId.value, 
      userId: event.target.userId.value, 
      supplierId: selectedSupplier,
      quotationId: event.target.quotationId.value,  
      purchaseId: selectedPurchaseOrder,
    };

    await addPoApprove(formData);
  };
  
 
  

  return (
    <div className={styles.wrapper}>
          <div className={styles.container} >
     {loading && <p>Loading clients...</p>}
    {error && <p>Error: {error}</p>}
    {!loading && !error && (
      <form onSubmit={handleSubmit} className={styles.form}>
          <select name='userId'>
        <option value="" disabled selected>Select An Admin</option>
        {users.filter((user) => isAdminRole(user?.role)).map(adminUser => (
          <option key={adminUser._id} value={adminUser._id}>
            {adminUser.username}
          </option>
        ))}
      </select>
          <select name='saleId' >
          <option value="" disabled selected>Select Sale Representative </option>
          {sales.map((sale) => (
              <option key={sale._id} value={sale._id}>
                  {sale.name}
              </option>
            ))}
          </select>
          <select name="supplierId" onChange={handleSupplierChange} value={selectedSupplier}>
          {renderSupplierOptions()}
        </select>
        <select name="purchaseId" onChange={handlePurchaseOrderChange} value={selectedPurchaseOrder}>
          {renderPurchaseOptions()}
        </select>
          <select name='quotationId'>
          <option value="" disabled selected>Select Quotation</option>
          {quotations.map((quotation) => (
              <option key={quotation._id} value={quotation._id}>
                  {quotation.quotationId}
              </option>
            ))}
          </select> 
            <button type="submit">Approve</button>
      </form>
      )}
      </div>
    </div>
   
  );
}

export default AddApprovePo
