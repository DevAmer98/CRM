"use client";
import React, {useState ,useEffect} from 'react'; 
import styles from '@/app/ui/dashboard/approve/approve.module.css';
import { addPurchaseOrder } from '@/app/lib/actions';
import { FaPlus, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { useRouter } from 'next/navigation';




  const productSchema = z.object({
    productCode: z.string().optional(),
    unitPrice: z.number().optional(),
    unit: z.number().optional(),
    qty: z.number().optional(),
    description: z.string().optional(),
  });


 


  
  const purchaseSchema = z.object({
    userId: z.string().min(1, "User Pro is required"),
    supplierId: z.string().min(1, "Supplier is required"),
    jobOrderId: z.string().min(1, "Job Order is required"),
    products: z.array(productSchema),
    paymentTerm: z.string().optional(),
    deliveryLocation: z.string().optional(),
    sellingPolicy:z.string().optional(),
    deliveryTerm:z.string().optional(),
    validityPeriod:z.string().optional(),
    delayPenalties:z.string().optional(),
 
  });


const AddPurchaseOrder = () => {
  const router = useRouter();
  const [rows, setRows] = React.useState([{ number: 1 }]);
  const[suppliers, setSuppliers] = useState([]); 
  const[jobOrders, setJobOrders] = useState([]); 
    const[userPro, setUserPro] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const domain = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";




  useEffect(() => { 
    const fetchSuppliers = async () => {
      try {
        const response = await fetch(`${domain}/api/allSuppliers`, { method: 'GET' });
        const data = await response.json();
        console.log('Suppliers fetched:', data);
        setSuppliers(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching suppliers:', error);
        setLoading(false);
      }
    };
  
    fetchSuppliers();
  }, []);




  useEffect(() => { 
    const fetchJobs = async () => {
      try {
        const response = await fetch(`${domain}/api/allJobs`, { method: 'GET' });
        const data = await response.json();
        console.log('Job Orders fetched:', data);
        setJobOrders(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching jobs:', error);
        setLoading(false);
      }
    };
  
    fetchJobs();
  }, []);

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


  const addRow = () => {
    const newRow = { number: rows.length + 1 }; 
    setRows([...rows, newRow]); 
  };

  const deleteRow = (index) => { 
    const updatedRows = rows.filter((_, i) => i !== index);
    const updatedRowsWithNumbers = updatedRows.map((row, i) => ({ ...row, number: i + 1 }));
    setRows(updatedRowsWithNumbers);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = {
      userId: event.target.userId.value, 
      supplierId: event.target.supplierId.value, 
      jobOrderId: event.target.jobOrderId.value, 
 
      deliveryLocation: event.target.deliveryLocation.value,
      products: rows.map((row, index) => ({
        number: index + 1,
        productCode: event.target[`productCode${index}`].value,
        unitPrice:
        !isNaN(event.target[`qty${index}`].value) &&
        !isNaN(event.target[`unit${index}`].value)
          ? Number(event.target[`qty${index}`].value) * Number(event.target[`unit${index}`].value)
          : 0, 
        unit: Number(event.target[`unit${index}`].value),
        qty: Number(event.target[`qty${index}`].value),
        description: event.target[`description${index}`].value,
})),
      paymentTerm: event.target.paymentTerm.value,
      deliveryTerm: event.target.deliveryTerm.value,
      deliveryLocation: event.target.deliveryLocation.value,
      sellingPolicy: event.target.sellingPolicy.value,
      validityPeriod: event.target.validityPeriod.value,
      delayPenalties: event.target.delayPenalties.value,

       };


     try {
            const validatedData = purchaseSchema.parse(formData);
            const result = await addPurchaseOrder(validatedData);
            if (result.success) {
              toast.success('Purchase order added successfully!');
              router.push('/dashboard/purchaseOrder');
            }
          } catch (error) { 
            if (error instanceof z.ZodError) {
              error.errors.forEach((err) => {
                toast.error(err.message);
              });
            } else if (error.message.includes("already exists")) { // Specific check for duplicate key error
              toast.error(error.message);
            } else {
              toast.error(error.message);
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
          <div className={styles.inputContainer}>
                <label htmlFor="userId" className={styles.label}>
               Select Procurement User:               
                </label>
          <select name='userId' className={styles.input} defaultValue="">
          <option value="" disabled >Select Procurement User </option>
          {userPro.map((user) => (
              <option key={user._id} value={user._id}>
                  {user.username}
              </option>
            ))}
          </select>
          </div>
          <div className={styles.inputContainer}>
                <label htmlFor="supplierName" className={styles.label}>
                Supplier Name:
                </label>
          <select name='supplierId' className={styles.input} defaultValue="">
          <option value="" disabled >Select Supplier</option>
          {suppliers.map((supplier) => (
              <option key={supplier._id} value={supplier._id}>
                  {supplier.name}
              </option>
            ))}
          </select>
          </div>
            <div className={styles.inputContainer}>
                <label htmlFor="jobOrder" className={styles.label}>
                Job Order:
                </label>
          <select name='jobOrderId' className={styles.input} defaultValue="">
          <option value="" disabled >Select Job Order</option>
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
                  <td>Description</td>
                  <td>Qty</td>
                  <td>Unit Price</td> 
                  <td>Total Price</td>
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
                    <td><textarea name={`description${index}`} className={`${styles.input1} ${styles.textarea}`}></textarea></td>
                    <td><input type='number' name={`qty${index}`} className={styles.input1} /></td>
                    <td><input type='number' name={`unit${index}`} className={styles.input1} /></td>
                    <td>{row.unitPrice}</td>
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
          <div className={styles.inputContainer}>
                <label htmlFor="paymentTerm" className={styles.label}>
                Payment Term:
                </label>
            <textarea type='text' name='paymentTerm' className={styles.input} placeholder='Payment Terms' />
            </div>
            <div className={styles.inputContainer}>
                <label htmlFor="deliveryTerm" className={styles.label}>
                Delivery Terms
                </label>
            <textarea type='text' name='deliveryTerm' className={styles.input} placeholder='Delivery Terms' />
            </div>
             <div className={styles.inputContainer}>
                <label htmlFor="validityPeriod" className={styles.label}>
                Validity Period:
                </label>
            <textarea type='text' name='validityPeriod' className={styles.input} placeholder='Validity Period' />
            </div>
             <div className={styles.inputContainer}>
                <label htmlFor="delayPenalties" className={styles.label}>
                Delay Penalties:
                </label>
            <textarea type='text' name='delayPenalties' className={styles.input} placeholder='Delay Penalties' />
            </div>
            <div className={styles.inputContainer}>
                <label htmlFor="sellingPolicy" className={styles.label}>
                Selling Policy:
                </label>
            <textarea type='text' name='sellingPolicy' className={styles.input} placeholder='Selling Policy' />
            </div>
            <button type="submit">Submit</button>
          </div>
        </div>
      </form> 
      )}
    </div>
  );
};

export default AddPurchaseOrder;
