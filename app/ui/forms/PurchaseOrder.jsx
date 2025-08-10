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
  sellingPolicy: z.string().optional(),
  deliveryTerm: z.string().optional(),
  validityPeriod: z.string().optional(),
  delayPenalties: z.string().optional(),
  totalPrice: z.number().min(0, "Total price must be 0 or higher"),  // ✅ ADD THIS LINE
});



const AddPurchaseOrder = () => {
  const router = useRouter();
const [rows, setRows] = useState([]);
  const[suppliers, setSuppliers] = useState([]); 
  const[jobOrders, setJobOrders] = useState([]); 
    const[userPro, setUserPro] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const domain = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const [selectedCurrency, setSelectedCurrency] = useState('SAR'); 
    const [jobOrderProducts, setJobOrderProducts] = useState([]);

  




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


    const handleRowInputChange = (index, fieldName, value) => {
    setRows((prevRows) =>
      prevRows.map((row, i) =>
        i === index
          ? {
              ...row,
              [fieldName]: value,
              unitPrice:
                fieldName === 'qty' && !isNaN(value) && !isNaN(row.unit)
                  ? Number(value) * Number(row.unit)
                  : fieldName === 'unit' && !isNaN(value) && !isNaN(row.qty)
                  ? Number(value) * Number(row.qty)
                  : row.unitPrice,
            }
          : row
      )
    );
  };



  


const handleRowChange = (index, field, value) => {
  setRows((prevRows) => {
    const updatedRows = [...prevRows];
    updatedRows[index][field] = Number(value);

    const qty = updatedRows[index].qty;
    const unit = updatedRows[index].unit;
    updatedRows[index].unitPrice = !isNaN(qty) && !isNaN(unit) ? qty * unit : 0;

    return updatedRows;
  });
};


const handleSubmit = async (event) => {
  event.preventDefault();

  
const products = rows.map(row => ({
  number: row.number,
  productCode: row.productCode,
  description: row.description,
  qty: row.qty,
  unit: row.unit,
  unitPrice: row.unitPrice,
}));


const totals = calculateTotalUnitPrice();
const totalPrice = selectedCurrency === 'SAR'
  ? Number(totals.totalUnitPriceWithVAT)
  : Number(totals.totalUnitPrice); // Exclude VAT for USD


  


  const formData = {
    userId: event.target.userId.value,
    supplierId: event.target.supplierId.value,
    jobOrderId: event.target.jobOrderId.value,
    deliveryLocation: event.target.deliveryLocation.value,
    products,
    paymentTerm: event.target.paymentTerm.value,
    deliveryTerm: event.target.deliveryTerm.value,
    sellingPolicy: event.target.sellingPolicy.value,
    validityPeriod: event.target.validityPeriod.value,
    delayPenalties: event.target.delayPenalties.value,
    totalPrice, 
     currency: selectedCurrency,
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
      error.errors.forEach((err) => toast.error(err.message));
    } else {
      toast.error(error.message);
    }
  }
};


const handleSelectProduct = (product) => {
  setRows((prevRows) => {
    const alreadyExists = prevRows.some(
      (row) => row.productCode === product.productCode
    );

    if (alreadyExists) {
      toast.error("Product already added!");
      return prevRows;
    }

    const newRows = [
      ...prevRows,
      {
        number: prevRows.length + 1,
        productCode: product.productCode || '',
        description: product.description || '',
        qty: product.qty || 0,
   
      },
    ];

    // Scroll to editable table
    setTimeout(() => {
      document.getElementById("poTable")?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    return newRows;
  });
};




 const calculateTotalUnitPrice = () => {
    const totalUnitPrice = rows.reduce((total, row) => total + (Number(row.unitPrice) || 0), 0);
    const vatRate = selectedCurrency === 'USD' ? 0 : 0.15; // 0% VAT for USD, 15% for SAR
    const vatAmount = totalUnitPrice * vatRate;
    const totalUnitPriceWithVAT = totalUnitPrice + vatAmount;
  
   
  
    return {
      totalUnitPrice: totalUnitPrice.toFixed(2), // Format to 2 decimal places
      vatAmount: vatAmount.toFixed(2), // Format to 2 decimal places
      totalUnitPriceWithVAT: totalUnitPriceWithVAT.toFixed(2), // Format to 2 decimal places
    };
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
<select
  name="jobOrderId"
  className={styles.input}
  defaultValue=""
 onChange={(e) => {
  const selectedId = e.target.value;
  const jobOrder = jobOrders.find((jo) => jo._id === selectedId);
  console.log("Selected Job Order:", jobOrder); // <-- DEBUG here

  if (jobOrder?.quotation?.products) {
    setJobOrderProducts(jobOrder.quotation.products);
  } else {
    console.warn("No quotation products found for job order");
    setJobOrderProducts([]);
  }
}
}
>
          <option value="" disabled >Select Job Order</option>
          {jobOrders.map((jobOrder) => (
              <option key={jobOrder._id} value={jobOrder._id}>
{jobOrder.jobOrderId}
              </option>
            ))}
          </select>

          {jobOrderProducts.length > 0 && (
  <div className={styles.jobOrderTableContainer}>
    <p className={styles.title}>Job Order Products</p>
<table className={styles.table} id="poTable">
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
  {jobOrderProducts.map((product, index) => (
    <tr key={index}> 
      <td>{(index + 1).toString().padStart(3, '0')}</td>
      <td>{product.productCode || '-'}</td>
      <td>{product.description || '-'}</td>
      <td>{product.qty || '-'}</td>
      <td>
 
      <div className={styles.buttons}>
        
       {rows.some((row) => row.productCode === product.productCode) ? (
  <button className={`${styles.selectButton} ${styles.DisabledButton}`} disabled>
    Added
  </button>
) : (
  <button
    type="button"
    onClick={() => handleSelectProduct(product)}
    className={styles.selectButton}
  >
    Add
  </button>
)}

        </div>
      </td>
    </tr>
  ))}
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
              <div className={styles.selectContainer}>
            <div className={styles.selectWrapper}>
            <div className={styles.inputContainer}>
                <label htmlFor="paymentTerm" className={styles.label}>
                Select Currency:
                </label>
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
                    <td>
                      <input
                        className={styles.input}
                        placeholder={row.productCode}
                        value={row.productCode}
                        onChange={(e) => handleRowInputChange(index, 'productCode', e.target.value)}
                      />
                    </td>
                    <td>
                    <textarea
                        className={`${styles.input} ${styles.textarea}`}
                        placeholder={row.description}
                        value={row.description}
                        onChange={(e) => handleRowInputChange(index, 'description', e.target.value)}
                      ></textarea>
</td>
                    <td>
           <input
  type="number"
  name={`qty${index}`}
  className={styles.input1}
  value={row.qty}
  onChange={(e) => handleRowChange(index, 'qty', e.target.value)}
/>
</td>
<td>
<input
  type="number"
  name={`unit${index}`}
  className={styles.input1}
  value={row.unit}
  onChange={(e) => handleRowChange(index, 'unit', e.target.value)}
/>

          </td>
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
          <div className={styles.form5}>
          <p>Total Unit Price (Excluding VAT): {calculateTotalUnitPrice().totalUnitPrice}</p>
            <p>VAT (15%): {calculateTotalUnitPrice().vatAmount}</p>
            <p>Total Unit Price (Including VAT): {calculateTotalUnitPrice().totalUnitPriceWithVAT}</p>
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
