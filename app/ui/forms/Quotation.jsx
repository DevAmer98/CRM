'use client'
import styles from '@/app/ui/dashboard/approve/approve.module.css';
import { addQuotation } from '@/app/lib/actions'
import { FaPlus, FaTrash } from 'react-icons/fa';
import React, { useEffect, useState } from 'react'
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';



  const productSchema = z.object({
    productCode: z.string().optional(),
    unitPrice: z.number().optional(),
    unit: z.number().optional(),
    qty: z.number().optional(),
    description: z.string().optional(),
  });
  
  const quotationSchema = z.object({
    saleId: z.string().min(1, "Sale Representative is required"),
    clientId: z.string().min(1, "Client is required"),
    projectName: z.string().optional(),
    projectLA: z.string().optional(),
    products: z.array(productSchema),
    paymentTerm: z.string().optional(),
    paymentDelivery: z.string().optional(),
    validityPeriod: z.string().optional(),
    note: z.string().optional(),
    excluding: z.string().optional(),
      currency: z.enum(["USD", "SAR"], { message: "Currency is required" }), // ✅ Add this line

 
  });
 




const AddQuotation = () => {
    const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const [clients, setClients] = useState([]); 
  const [sales, setSales] = useState([]); 
  const [rows, setRows] = React.useState([{ number: 1 }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const domain = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const [selectedCurrency, setSelectedCurrency] = useState('USD'); 
  


  

  const fetchClients = async () => {
    try {
        console.log('fetchClients: Fetching clients...');
        const response = await fetch(`${domain}/api/allClients`, {
            cache: 'no-store', 
            method: 'GET'
        });
        const data = await response.json();
        console.log('fetchClients: Clients fetched:', data);
        setClients(data);
        setLoading(false);
    } catch (error) {
        console.error('fetchClients: Error fetching clients:', error);
        setLoading(false);
    }
};

useEffect(() => {
    console.log('useEffect: Fetching clients...');
    fetchClients();
}, []);

  
  
  

    const fetchSales= async () => {
      try {
        console.log('fetchSales: Fetching sales...');
        const response = await fetch(`${domain}/api/allSales`, { method: 'GET' });
        const data = await response.json();
        setSales(data);
        console.log('fetchSales: sales fetched:', data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        setLoading(false);
      }
    };
    useEffect(() => {
      console.log('useEffect: Fetching sales...');
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

    const formData = {
      saleId: event.target.saleId.value, 
      clientId: event.target.clientId.value, 
      projectName: event.target.projectName.value,
      projectLA: event.target.projectLA.value,
     
products: rows.map((row, index) => ({
  number: index + 1,
  productCode: event.target[`productCode${index}`].value,
  unit: Number(event.target[`unit${index}`].value),
  qty: Number(event.target[`qty${index}`].value),
  unitPrice:
    !isNaN(event.target[`qty${index}`].value) &&
    !isNaN(event.target[`unit${index}`].value)
      ? Number(event.target[`qty${index}`].value) * Number(event.target[`unit${index}`].value)
      : 0,
  description: event.target[`description${index}`].value,
})),
      paymentTerm: event.target.paymentTerm.value,
      paymentDelivery: event.target.paymentDelivery.value,
      validityPeriod: event.target.validityPeriod.value,
      note: event.target.note.value,
      excluding: event.target.excluding.value,
        currency: selectedCurrency,  

    };

      try {
            const validatedData = quotationSchema.parse(formData);
            const result = await addQuotation(validatedData);
            if (result.success) {
              toast.success('Quotation added successfully!');
              router.push('/dashboard/quotations');
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
  

  useEffect(() => {
    setIsClient(typeof window !== 'undefined');
  }, []);

    
  return (
    <div className={styles.container}>
    <form onSubmit={handleSubmit}>
        <div className={styles.container}>
          <div className={styles.form1}>
          <div className={styles.inputContainer}>
                <label htmlFor="saleName" className={styles.label}>
                Sale Representative Name:
                </label>
          <select name='saleId' className={styles.input} defaultValue="">
         <option value="" disabled>Select Sale Representative</option>
       {sales.map((sale) => (
         <option key={sale._id} value={sale._id}>
          {sale.name}
       </option>
        ))}
          </select>
          </div>
          <div className={styles.inputContainer}>
                <label htmlFor="clientName" className={styles.label}>
                  Client Name:
                </label>
        
          <select name='clientId' className={styles.input} defaultValue="">
  <option value="" disabled>Select Client</option>
  
  {clients.map((client) => (
    <option key={client._id} value={client._id}>
      {client.name}
    </option>
  ))}
</select>
          </div>
          <div className={styles.inputContainer}>
                <label htmlFor="projectName" className={styles.label}>
                Project Name:
                </label>
            <input type='text' name='projectName' className={styles.input} placeholder='Project Name' />
            </div>
            <div className={styles.inputContainer}>
                <label htmlFor="projectLA" className={styles.label}>
                  Project Location Address:
                </label>
            <input type='text' name='projectLA' className={styles.input} placeholder='Project Location Address' />
            </div>
          </div>
        </div>

        <div className={styles.container}>
          <div className={styles.form2}>
            <p className={styles.title}>Products</p>
             <div className={styles.selectContainer}>
            <div className={styles.selectWrapper}>
            <label htmlFor="currency" className={styles.selectLabel}>Select Currency:</label>
          <select
          id="currency"
          value={selectedCurrency}
          onChange={(e) => setSelectedCurrency(e.target.value)}
          className={styles.select}
          >
          <option value="USD">USD</option>
          <option value="SAR">SAR</option>
        </select>
        </div>
        </div>
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
                    <td><input type='number' name={`qty${index}`} className={styles.input1} step="any" /></td>
                    <td><input type='number' name={`unit${index}`} className={styles.input1} step="any" /></td>

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
              <div className={styles.inputContainer}>
                <label htmlFor="validityPeriod" className={styles.label}>
                Validity Period:
                </label>
            <textarea type='text' name='validityPeriod' className={styles.input} placeholder='Validity Period' />
            </div>
            <div className={styles.inputContainer}>
                <label htmlFor="excluding" className={styles.label}>
                Excluding:
                </label>
            <textarea type='text' name='excluding' className={styles.input} placeholder='Excluding' />
            </div>
            <button type="submit">Submit</button>
          </div>
        </div>
        
      </form>
</div>
  )
}

export default AddQuotation