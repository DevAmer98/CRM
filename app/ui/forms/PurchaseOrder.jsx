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
    saleId: z.string().min(1, "Sale Representative is required"),
    supplierId: z.string().min(1, "Supplier is required"),
    quotationId: z.string().min(1, "Quotation is required"),
    products: z.array(productSchema),
    paymentTerm: z.string().optional(),
    paymentDelivery: z.string().optional(),
    deliveryLocation: z.string().optional(),
    note: z.string().optional(),
 
  });


const AddPurchaseOrder = () => {
  const router = useRouter();
  const [rows, setRows] = React.useState([{ number: 1 }]);
  const[suppliers, setSuppliers] = useState([]); 
  const[quotations, setQuotations] = useState([]); 
  const[sales, setSales] = useState([]); 
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
    const fetchQuotations = async () => {
      try {
        const response = await fetch(`${domain}/api/allQuotations`, { method: 'GET' });
        const data = await response.json();
        console.log('Quotations fetched:', data);
        setQuotations(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching suppliers:', error);
        setLoading(false);
      }
    };
  
    fetchQuotations();
  }, []);


  useEffect(() => { 
    const fetchSales = async () => {
      try {
        const response = await fetch(`${domain}/api/allSales`, { method: 'GET' });
        const data = await response.json();
        console.log('sales fetched:', data);
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
      saleId: event.target.saleId.value, 
      supplierId: event.target.supplierId.value, 
      quotationId: event.target.quotationId.value, 
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
      paymentDelivery: event.target.paymentDelivery.value,
      note: event.target.note.value,
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
                <label htmlFor="saleId" className={styles.label}>
                Select Sale Representative:
                </label>
          <select name='saleId' className={styles.input} defaultValue="">
          <option value="" disabled >Select Sale Representative </option>
          {sales.map((sale) => (
              <option key={sale._id} value={sale._id}>
                  {sale.name}
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
                <label htmlFor="quotationId" className={styles.label}>
                Quotation Number:
                </label>





          <select name='quotationId' className={styles.input} defaultValue="">
          <option value="" disabled >Select Quotation</option>
          {quotations.map((quotation) => (
              <option key={quotation._id} value={quotation._id}>
                  {quotation.quotationId}
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
            <textarea type='text' name='paymentTerm' className={styles.input} placeholder='Payment Term' />
            </div>
            <div className={styles.inputContainer}>
                <label htmlFor="paymentDelivery" className={styles.label}>
                Payment Delivery:
                </label>
            <textarea type='text' name='paymentDelivery' className={styles.input} placeholder='Payment Delivery' />
            </div>
            <div className={styles.inputContainer}>
                <label htmlFor="note" className={styles.label}>
                Note:
                </label>
            <textarea type='text' name='note' className={styles.input} placeholder='Note' />
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
