"use server";
import { revalidatePath } from "next/cache";
import { connectToDB } from "./utils";
import { redirect } from "next/navigation";
import bcrypt from 'bcrypt';
import { signIn } from "../auth";
import {
  gregorianToHijri as toHijriObj,
  hijriToGregorian as toGregorianObj
} from '@tabby_ai/hijri-converter';




const { User, Client, Supplier, PurchaseOrder, Quotation, JobOrder, Sale, Coc, Pl, Approve, ApprovePo, Employee } = require('@/app/lib/models')



export const addUser = async (formData) => {
  const { username, email, password, phone, address,isActive, role } = Object.fromEntries(formData);
  console.log("Role submitted:", role); // This will help verify what role is being sent


  try {
     connectToDB();

    const salt = await bcrypt.genSalt(10)
    const hashPassword = await bcrypt.hash(password, salt)
    const newUser = new User({
      username,
      email,
      password: hashPassword,
      phone,
      address,
      role,
      isActive
    });

    await newUser.save();
  } catch (err) {
    console.log(err)
    throw new Error('failed to add user!')
  }

  revalidatePath("/dashboard/users");
  redirect("/dashboard/users");
};


export const updateUser = async (formData) => {
  const { id, username, email, password, phone, address, role, isActive } =
    Object.fromEntries(formData);

  try {
    connectToDB();

    const updateFields = {
      username,
      email,
      phone,
      address,
      role,
      isActive,
    };

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash(password, salt);
      updateFields.password = hashPassword;
    }

    Object.keys(updateFields).forEach(
      (key) =>
        (updateFields[key] === "" || updateFields[key] === undefined) && delete updateFields[key]
    );

    await User.findByIdAndUpdate(id, updateFields);
  } catch (err) {
    console.log(err);
    throw new Error("Failed to update user!");
  }

  revalidatePath("/dashboard/users");
  redirect("/dashboard/users");
};


export const deleteUser = async (formData) => {
  const { id } = Object.fromEntries(formData);

  try {
     connectToDB();        
    await User.findByIdAndDelete(id)

  } catch (err) {
    console.log(err)
    throw new Error('failed to delete user!')
  }

  revalidatePath("/dashboard/users");
};





export const addClient = async ({ name, phone, contactName, contactMobile, email, address }) => {
  try {
    connectToDB();

    const newClient = new Client({
      name,
      phone,
      contactName,
      contactMobile,
      email,
      address
    });

    await newClient.save();
    revalidatePath("/dashboard/clients");
    return { success: true };  // Indicate success
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      const value = err.keyValue[field];
      return { success: false, message: `A client with the same ${field} "${value}" already exists.` }; // Custom error response
    }
    return { success: false, message: 'Failed to add client!' }; // Generic error response
  
  }
};
// Gregorian → Hijri
export const gregorianToHijri = (gregorianDateString) => {
  try {
    const date = new Date(gregorianDateString);
    const hijri = toHijriObj({
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
    });
    const m = String(hijri.month).padStart(2, '0');
    const d = String(hijri.day).padStart(2, '0');
    return `${hijri.year}/${m}/${d}`;
  } catch (error) {
    console.error('Error in gregorianToHijri:', error);
    return null;
  }
};

// Hijri → Gregorian
export const hijriToGregorian = ({ year, month, day }) => {
  try {
    const greg = toGregorianObj({ year, month, day });
    const m = String(greg.month).padStart(2, '0');
    const d = String(greg.day).padStart(2, '0');
    return `${greg.year}-${m}-${d}`;
  } catch (error) {
    console.error('Error in hijriToGregorian:', error);
    return null;
  }
};



/*const hijriToGregorian = (hijriYear, hijriMonth, hijriDay) => {
  try {
    const hijriEpoch = new Date('622-07-16');
    const avgHijriYear = 354.367;
    const avgHijriMonth = 29.53;
    
    const totalHijriDays = (hijriYear - 1) * avgHijriYear + 
                          (hijriMonth - 1) * avgHijriMonth + 
                          hijriDay - 1;
    
    const gregorianDate = new Date(hijriEpoch.getTime() + totalHijriDays * 24 * 60 * 60 * 1000);
    return gregorianDate.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error in hijriToGregorian:', error);
    return null;
  }
};

const gregorianToHijri = (gregorianDate) => {
  try {
    const date = new Date(gregorianDate);
    const hijriEpoch = new Date('622-07-16');
    const daysDiff = Math.floor((date - hijriEpoch) / (24 * 60 * 60 * 1000));
    const avgHijriYear = 354.367;
    const avgHijriMonth = 29.53;
    
    const hijriYear = Math.floor(daysDiff / avgHijriYear) + 1;
    const remainingDays = daysDiff - (hijriYear - 1) * avgHijriYear;
    const hijriMonth = Math.min(12, Math.max(1, Math.floor(remainingDays / avgHijriMonth) + 1));
    const hijriDay = Math.min(30, Math.max(1, Math.floor(remainingDays % avgHijriMonth) + 1));
    
    return `${Math.max(1, hijriYear)}/${String(hijriMonth).padStart(2, '0')}/${String(hijriDay).padStart(2, '0')}`;
  } catch (error) {
    console.error('Error in gregorianToHijri:', error);
    return null;
  }
};
*/
// Helper function to parse Hijri date string
const parseHijriDate = (hijriDateString) => {
  if (!hijriDateString) return null;
  
  const parts = hijriDateString.split('/');
  if (parts.length !== 3) return null;
  
  return {
    year: parseInt(parts[0]),
    month: parseInt(parts[1]),
    day: parseInt(parts[2])
  };
};

// Helper function to convert dates between formats
export const convertDateFormats = (dateString, fromFormat, toFormat) => {
  if (!dateString) return null;

  try {
    if (fromFormat === 'gregorian' && toFormat === 'hijri') {
      return gregorianToHijri(dateString);
    } else if (fromFormat === 'hijri' && toFormat === 'gregorian') {
      // Validate Hijri string format
      if (!/^\d{4}\/\d{2}\/\d{2}$/.test(dateString)) {
        console.warn(`Invalid Hijri date format: ${dateString}`);
        return null;
      }

      const hijriDate = parseHijriDate(dateString);
      if (!hijriDate) return null;
      return hijriToGregorian(hijriDate.year, hijriDate.month, hijriDate.day);
    }

    return dateString;
  } catch (error) {
    console.error('Date conversion error:', error);
    return null;
  }
};




export const addEmployee = async ({ 
  employeeNo,
  name,
  contactMobile,
  email,
  iqamaNo,
  iqamaExpirationDate,
  iqamaExpirationDateHijri,
  passportNo,
  passportExpirationDate,
  passportExpirationDateHijri,
  dateOfBirth,
  dateOfBirthHijri,
  jobTitle,
  directManager,
  contractDuration,
  contractStartDate,
  contractStartDateHijri,
  contractEndDate,
  contractEndDateHijri,
  dateFormat // Track which format was used for input
}) => {
  try {
    connectToDB();

    const newEmployee = new Employee({
      employeeNo,
      name,
      contactMobile,
      email,
      iqamaNo,
      iqamaExpirationDate,
      iqamaExpirationDateHijri,
      passportNo,
      passportExpirationDate,
      passportExpirationDateHijri,
      dateOfBirth,
      dateOfBirthHijri,
      jobTitle,
      directManager,
      contractDuration,
      contractStartDate,
      contractStartDateHijri,
      contractEndDate,
      contractEndDateHijri,
      dateFormat, // Store the original input format
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await newEmployee.save();
    revalidatePath("/dashboard/employees");
    return { success: true };
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      const value = err.keyValue[field];
      return { success: false, message: `An Employee with the same ${field} "${value}" already exists.` };
    }
    return { success: false, message: 'Failed to add employee!' };
  }
};

export const updateEmployee = async (formData) => {
  const {
    id,
    employeeNo,
    name,
    contactMobile,
    email,
    iqamaNo,
    iqamaExpirationDate,
    iqamaExpirationDateHijri,
    passportNo,
    passportExpirationDate,
    passportExpirationDateHijri,
    dateOfBirth,
    dateOfBirthHijri,
    jobTitle,
    directManager,
    contractDuration,
    contractStartDate,
    contractStartDateHijri,
    contractEndDate,
    contractEndDateHijri,
    dateFormat
  } = formData;

  if (!id) {
    throw new Error('Employee ID is required');
  }

  try {
    connectToDB();

    const updateFields = {
      name,
      employeeNo,
      contactMobile,
      email,
      iqamaNo,
      iqamaExpirationDate,
      iqamaExpirationDateHijri,
      passportNo,
      passportExpirationDate,
      passportExpirationDateHijri,
      dateOfBirth,
      dateOfBirthHijri,
      jobTitle,
      directManager,
      contractDuration,
      contractStartDate,
      contractStartDateHijri,
      contractEndDate,
      contractEndDateHijri,
      dateFormat,
      updatedAt: new Date()
    };

    // Remove empty or undefined fields
    Object.keys(updateFields).forEach(
      (key) =>
        (updateFields[key] === "" || updateFields[key] === undefined) && delete updateFields[key]
    );

    console.log('Final Update Fields:', updateFields);

    const updatedEmployee = await Employee.findByIdAndUpdate(id, updateFields, { new: true });
    console.log('Updated Employee:', updatedEmployee);

    if (!updatedEmployee) {
      throw new Error('Employee not found');
    }

    revalidatePath('/dashboard/employees');
    revalidatePath(`/dashboard/employees/${id}`);

    return { success: true };
  } catch (err) {
    console.log(err);
    throw new Error("Failed to update employee!");
  }
};


// Enhanced function that automatically handles both date formats
export const addEmployeeWithDualDates = async (employeeData) => {
  console.log('Input employeeData:', employeeData);
  const { dateFormat } = employeeData;
  
  // List of date fields to process
  const dateFields = [
    'dateOfBirth',
    'iqamaExpirationDate', 
    'passportExpirationDate',
    'contractStartDate',
    'contractEndDate'
  ];
  
  // Create dual format data
  const enhancedData = { ...employeeData };
  
  // Process date fields with proper async handling
  for (const field of dateFields) {
    console.log(`Processing field: ${field}, value: ${employeeData[field]}, type: ${typeof employeeData[field]}`);
    
    if (employeeData[field]) {
      try {
        if (dateFormat === 'hijri') {
          // If input was Hijri, convert to Gregorian
          const gregorianDate = await convertDateFormats(employeeData[field], 'hijri', 'gregorian');
          console.log(`Converted ${field} from Hijri to Gregorian: ${gregorianDate}`);
          enhancedData[field] = gregorianDate;
          enhancedData[`${field}Hijri`] = employeeData[field];
        } else {
          // If input was Gregorian, convert to Hijri
          enhancedData[field] = employeeData[field];
          const hijriDate = await convertDateFormats(employeeData[field], 'gregorian', 'hijri');
          console.log(`Converted ${field} from Gregorian to Hijri: ${hijriDate}`);
          enhancedData[`${field}Hijri`] = hijriDate;
        }
      } catch (error) {
        console.error(`Error converting ${field}:`, error);
        // Keep original date if conversion fails
        enhancedData[field] = employeeData[field];
        if (dateFormat === 'hijri') {
          enhancedData[`${field}Hijri`] = employeeData[field];
        } else {
          enhancedData[`${field}Hijri`] = null;
        }
      }
    } else {
      console.log(`Field ${field} is empty or null`);
      // Set to null if field is empty but required
      enhancedData[field] = null;
      enhancedData[`${field}Hijri`] = null;
    }
  }
  
  console.log('Final enhancedData before saving:', enhancedData);
  return addEmployee(enhancedData);
};
/*
export const addEmployee = async ({ 
  employeeNo,
    name,
    contactMobile,
    email,
    iqamaNo,
    iqamaExpirationDate,
    passportNo,
    passportExpirationDate,
    dateOfBirth,
    jobTitle,
    directManager,
    contractDuration,
    contractStartDate,
    contractEndDate }) => {
  try {
    connectToDB();

    const newEmployee = new Employee({
      employeeNo,
      name,
        contactMobile,
        email,
        iqamaNo,
        iqamaExpirationDate,
        passportNo,
        passportExpirationDate,
        dateOfBirth,
        jobTitle,
        directManager,
        contractDuration,
        contractStartDate,
        contractEndDate,
    });

    await newEmployee.save();
    revalidatePath("/dashboard/employees");
    return { success: true };  // Indicate success
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      const value = err.keyValue[field];
      return { success: false, message: `An Employee with the same ${field} "${value}" already exists.` }; // Custom error response
    }
    return { success: false, message: 'Failed to add employee!' }; // Generic error response
  
  }
};
export const updateEmployee = async (formData) => {
  const {
    id,
    employeeNo,
    name,
    contactMobile,
    email,
    iqamaNo,
    iqamaExpirationDate,
    passportNo,
    passportExpirationDate,
    dateOfBirth,
    jobTitle,
    directManager,
    contractDuration,
    contractStartDate,
    contractEndDate,
  } = formData;

  if (!id) {
    throw new Error('Employee ID is required');
  }

  try {
    connectToDB();

    const updateFields = {
      name,
      employeeNo,
      contactMobile,
      email,
      iqamaNo,
      iqamaExpirationDate,
      passportNo,
      passportExpirationDate,
      dateOfBirth,
      jobTitle,
      directManager,
      contractDuration,
      contractStartDate,
      contractEndDate,
    };

    // Remove empty or undefined fields
    Object.keys(updateFields).forEach(
      (key) =>
        (updateFields[key] === "" || updateFields[key] === undefined) && delete updateFields[key]
    );

    console.log('Final Update Fields:', updateFields); // Debugging

    const updatedEmployee = await Employee.findByIdAndUpdate(id, updateFields, { new: true });
    console.log('Updated Employee:', updatedEmployee); // Debugging

    if (!updatedEmployee) {
      throw new Error('Employee not found');
    }

    revalidatePath('/dashboard/employees');
revalidatePath(`/dashboard/employees/${id}`);

    return { success: true };
  } catch (err) {
    console.log(err);
    throw new Error("Failed to update employee!");
  }
  
};*/


export const updateClient = async (formData) => {
  const { id, name, phone, contactName, contactMobile, email, address } =
    Object.fromEntries(formData);
    const idAsString = id.toString()

  try {
    connectToDB();

    const updateFields = {
      name,
      phone,
      contactName,
      contactMobile,
      email,
      address
    };

    Object.keys(updateFields).forEach(
      (key) =>
        (updateFields[key] === "" || undefined) && delete updateFields[key]
    );

    await Client.findByIdAndUpdate(idAsString, updateFields);
  } catch (err) {
    console.log(err);
    throw new Error("Failed to update client!");
  }

  revalidatePath("/dashboard/clients");
  redirect("/dashboard/clients");
};

export const deleteClient = async (formData) => {
  const { id } = Object.fromEntries(formData);

  try {
     connectToDB();        
    await Client.findByIdAndDelete(id)

  } catch (err) {
    console.log(err)
    throw new Error('failed to delete client!')
  }

  revalidatePath("/dashboard/clients");
};



export const deleteEmployee = async (formData) => {
  const { id } = Object.fromEntries(formData);

  try {
     connectToDB();        
    await Employee.findByIdAndDelete(id)

  } catch (err) {
    console.log(err)
    throw new Error('failed to delete employee!')
  }

  revalidatePath("/dashboard/employees");
};




export const addSale = async (formData) => {
  const { name, phone, contactName, contactMobile, email, address } = Object.fromEntries(formData);

  try {
     await connectToDB();

    const newSale = new Sale({
      name,
      phone,
      contactName,
      contactMobile,
      email,
      address
    });

    await newSale.save();
  } catch (err) {
    console.log(err)
    throw new Error('failed to add Sale!')
  }

  revalidatePath("/dashboard/sales");
  redirect("/dashboard/sales");
};

export const updateSale = async (formData) => {
  const { id, name, phone, contactName, contactMobile, email, address } =
    Object.fromEntries(formData);
    const idAsString = id.toString()

  try {
    connectToDB();

    const updateFields = {
      name,
      phone,
      contactName,
      contactMobile,
      email,
      address
    };

    Object.keys(updateFields).forEach(
      (key) =>
        (updateFields[key] === "" || undefined) && delete updateFields[key]
    );

    await Sale.findByIdAndUpdate(idAsString, updateFields);
  } catch (err) {
    console.log(err);
    throw new Error("Failed to update sale!");
  }

  revalidatePath("/dashboard/sales");
  redirect("/dashboard/sales");
};


export const deleteSale = async (formData) => {
  const { id } = Object.fromEntries(formData);

  try {
     connectToDB();        
    await Sale.findByIdAndDelete(id)

  } catch (err) {
    console.log(err)
    throw new Error('failed to delete sale!')
  }

  revalidatePath("/dashboard/sales");
};







export const addJobOrder = async (formData) => {
  const { poNumber, poDate, clientId, quotationId } = formData;

  try {
    await connectToDB();

    const client = await Client.findById(clientId).lean();
    console.log('Client:', client);
    
    if (!client) {
      console.error('Client not found with ID:', clientId);
      throw new Error('Client not found');
    }
    
    const quotation = await Quotation.findById(quotationId).lean();
    console.log('Quotation:', quotation);
    
    // Log for troubleshooting
    console.log(`Quotation client ID: ${quotation.client.toString()}, Provided client ID: ${client._id.toString()}`);

    if (!quotation || quotation.client.toString() !== client._id.toString()) {
      console.error('Quotation not found or does not belong to the client');
      throw new Error('Quotation not found or does not belong to the client');
    }
   

    const year = new Date().getFullYear();

    // Find the latest quotation for the current year
    const latestJobOrder = await JobOrder.findOne({
      jobOrderId: { $regex: `SVSJO-${year}-` }
    }).sort({ jobOrderId: -1 });

    // Generate new sequence number
    let sequenceNumber = '001';
    if (latestJobOrder) {
      const currentNumber = parseInt(latestJobOrder.jobOrderId.split('-')[2]);
      sequenceNumber = String(currentNumber + 1).padStart(3, '0');
    }
    const customJobOrderId = `SVSJO-${year}-${sequenceNumber}`;


    const jobOrder = new JobOrder({
      jobOrderId:customJobOrderId ,
      poNumber,
      poDate, 
      client: client._id, 
      quotation: quotation._id,
    });

    await jobOrder.save();

    const populatedJobOrder = await JobOrder.findById(jobOrder._id).populate('quotation').lean();

    return populatedJobOrder;
  } catch (error) {
    console.error('Error creating job order:', error);
    throw error; // Throw the error to catch it where the function is called
  
  } finally {
    revalidatePath("/dashboard/jobOrder");
    redirect("/dashboard/jobOrder");
  }
};

export const deleteJobOrder = async (formData) => {
  const { id } = Object.fromEntries(formData);

  try {
     connectToDB();        
    await JobOrder.findByIdAndDelete(id)

  } catch (err) {
    console.log(err)
    throw new Error('failed to delete job!')
  }

  revalidatePath("/dashboard/jobOrder");
};







export const addSupplier = async ({ name, phone, contactName, contactMobile, email, address }) => {
 

  try {
      connectToDB();

    const year = new Date().getFullYear();


    const latestSupplier = await Supplier.findOne({
      supplierId: { $regex: `SVS-S-${year}-` }
    }).sort({ supplierId: -1 });

    // Generate new sequence number
    let sequenceNumber = '001';
    if (latestSupplier) {
      const currentNumber = parseInt(latestSupplier.supplierId.split('-')[2]);
      sequenceNumber = String(currentNumber + 1).padStart(3, '0');
    }


    const customSupplierId = `SVS-S-${sequenceNumber}`;




    const newSupplier = new Supplier({
      name,
      phone,
      contactName,
      contactMobile,
      email,
      address,
      supplierId:customSupplierId,

    });

    await newSupplier.save();
    revalidatePath("/dashboard/suppliers");
    return { success: true };  // Indicate success
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      const value = err.keyValue[field];
      return { success: false, message: `A supplier with the same ${field} "${value}" already exists.` }; // Custom error response
    }
    return { success: false, message: 'Failed to add supplier!' }; // Generic error response
  }
};

export const deleteSupplier = async (formData) => {
  const { id } = Object.fromEntries(formData);

  try {
     connectToDB();        
    await Supplier.findByIdAndDelete(id)

  } catch (err) {
    console.log(err)
    throw new Error('failed to delete supplier!')
  }

  revalidatePath("/dashboard/suppliers");
};


export const updateSupplier = async (formData) => {
  const { id, name, phone, contactName, contactMobile, email, address } =
    Object.fromEntries(formData);

  try {
     connectToDB();

    const updateFields = {
      name,
      phone,
      contactName,
      contactMobile,
      email,
      address
    };

    Object.keys(updateFields).forEach(
      (key) =>
        (updateFields[key] === "" || undefined) && delete updateFields[key]
    );


    await Supplier.findByIdAndUpdate(id, updateFields);
  } catch (err) {
    console.log(err);
    throw new Error("Failed to update supplier!");
  }

  revalidatePath("/dashboard/suppliers");
  redirect("/dashboard/suppliers");
};


export const addApprove = async (formData) => {
  const { userId, quotationId, clientId, saleId} = formData;

  try {
    await connectToDB();

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const quotation = await Quotation.findById(quotationId);
    if (!quotation) {
      throw new Error('Quotation not found');
    }
    const client = await Client.findById(clientId);
    if (!client) {
      throw new Error('client not found');
    }
    const sale = await Sale.findById(saleId);
    if (!sale) {
      throw new Error('Sale not found');
    }
   


    const newApprove = new Approve({
      quotation: quotation._id,
      user: user._id,
      client: client._id,
      sale: sale._id,
    });

    const savedApprove = await newApprove.save();
    console.log('Approve added successfully:', savedApprove);

    return savedApprove;
  } catch (err) {
    console.error("Error adding approve:", err.message);
    throw new Error('Failed to add Approve!');
  } finally {
    revalidatePath("/dashboard/approves"); 
    redirect("/dashboard/approves");
  }
};

export const addPoApprove = async (formData) => {
  const { userId,purchaseId, quotationId, supplierId, saleId} = formData;

  try {
    await connectToDB();

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const quotation = await Quotation.findById(quotationId);
    if (!quotation) {
      throw new Error('Quotation not found');
    }
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      throw new Error('supplier not found');
    }
    const sale = await Sale.findById(saleId);
    if (!sale) {
      throw new Error('Sale not found');
    }
    const purchaseOrder = await PurchaseOrder.findById(purchaseId);
    if (!purchaseOrder) {
      throw new Error('Purchase not found');
    }
   
   


    const newPoApprove = new ApprovePo({
      quotation: quotation._id,
      purchaseOrder: purchaseOrder._id,
      user: user._id,
      supplier: supplier._id,
      sale: sale._id,
    });

    const savedPoApprove = await newPoApprove.save();
    console.log('Approve added successfully:', savedPoApprove);

    return savedPoApprove;
  } catch (err) {
    console.error("Error adding approve:", err.message);
    throw new Error('Failed to add Approve!');
  } finally {
    revalidatePath("/dashboard/approvePo"); 
    redirect("/dashboard/approvePo");
  }
};


/*
export const addQuotation = async (formData) => {
  const { saleId, clientId,  projectName, projectLA, products, paymentTerm, paymentDelivery, note, excluding } = formData;

  try {
    await connectToDB();

    const sale = await Sale.findById(saleId);
    if (!sale) {
      throw new Error('Sale not found'); 
    }

    const client = await Client.findById(clientId);
    if (!client) {
      throw new Error('Client not found');
    }
   

    const year = new Date().getFullYear();
    const startingNumber = 0;
    const count = await incrementCounter(year);
    const paddedCount = String(startingNumber + count).padStart(3, '0');
    const customQuotationId = `SVSSQ-${year}-${paddedCount}`;


    const newQuotation = new Quotation({
      client: client._id,
      sale: sale._id,
      projectName,
      projectLA,
      products,
      paymentTerm,
      paymentDelivery,
      note,
      excluding,
      quotationId: customQuotationId, 
      revisionNumber: 0
    });

    const savedQuotation = await newQuotation.save();
    console.log('Quotation added successfully:', savedQuotation);

    return savedQuotation;
  } catch (err) {
    console.error("Error adding quotation:", err.message);
    throw new Error('Failed to add Quotation!');
  } finally {
    revalidatePath("/dashboard/quotations"); 
    redirect("/dashboard/quotations");
  }
};*/

/*
export const addQuotation = async (formData) => {
  const { saleId, clientId, projectName, projectLA, products, paymentTerm, paymentDelivery, note,validityPeriod, excluding } = formData;

  try {
    await connectToDB();

    const sale = await Sale.findById(saleId);
    if (!sale) {
      throw new Error('Sale not found');
    }

    const client = await Client.findById(clientId);
    if (!client) {
      throw new Error('Client not found');
    }

    // Get current year
    const year = new Date().getFullYear();
    
    // Find the latest quotation for the current year
    const latestQuotation = await Quotation.findOne({
      quotationId: { $regex: `SVSSQ-${year}-` }
    }).sort({ quotationId: -1 });

    // Generate new sequence number
    let sequenceNumber = '001';
    if (latestQuotation) {
      const currentNumber = parseInt(latestQuotation.quotationId.split('-')[2]);
      sequenceNumber = String(currentNumber + 1).padStart(3, '0');
    }

    const customQuotationId = `SVSSQ-${year}-${sequenceNumber}`;

    const newQuotation = new Quotation({
      client: client._id,
      sale: sale._id,
      projectName,
      projectLA,
      products,
      paymentTerm,
      paymentDelivery,
      note,
      validityPeriod,
      excluding,
      quotationId: customQuotationId,
      revisionNumber: 0
    });

    const savedQuotation = await newQuotation.save();
    console.log('Quotation added successfully:', savedQuotation);

    return savedQuotation;
  } catch (err) {
    console.error("Error adding quotation:", err.message);
    throw new Error('Failed to add Quotation!');
  } finally {
    revalidatePath("/dashboard/quotations");
    redirect("/dashboard/quotations");
  }
};

*/


export const addQuotation = async (formData) => {
  const { saleId, clientId, projectName, projectLA, products, paymentTerm, paymentDelivery, note, validityPeriod, excluding } = formData;

  try {
    await connectToDB();

    const sale = await Sale.findById(saleId);
    if (!sale) throw new Error('Sale not found');

    const client = await Client.findById(clientId);
    if (!client) throw new Error('Client not found');

    const year = new Date().getFullYear();
    const latestQuotation = await Quotation.findOne({
      quotationId: { $regex: `SVSSQ-${year}-` }
    }).sort({ quotationId: -1 });

    let sequenceNumber = '001';
    if (latestQuotation) {
      const currentNumber = parseInt(latestQuotation.quotationId.split('-')[2]);
      sequenceNumber = String(currentNumber + 1).padStart(3, '0');
    }

    const customQuotationId = `SVSSQ-${year}-${sequenceNumber}`;

    const newQuotation = new Quotation({
      client: client._id,
      sale: sale._id,
      projectName,
      projectLA,
      products,
      paymentTerm,
      paymentDelivery,
      note,
      validityPeriod,
      excluding,
      quotationId: customQuotationId,
      revisionNumber: 0
    });

    await newQuotation.save();
    console.log('Quotation added successfully:', customQuotationId);

    return { success: true, quotationId: customQuotationId }; // ✅ important
  } catch (err) {
    console.error("Error adding quotation:", err.message);
    return { success: false, error: err.message }; // ✅ safe failure response
  }
};





export const updateQuotation = async (formData) => {
  const { id, projectName, projectLA, products, paymentTerm, paymentDelivery, note, excluding } = formData;

  try {
    await connectToDB();
    const quotation = await Quotation.findById(id);

    if (!quotation) {
      throw new Error('Quotation not found');
    }

    // Increment revision number for each update
    quotation.revisionNumber += 1;
    if (quotation.quotationId) {
      const baseId = quotation.quotationId.split(" Rev.")[0];
      quotation.quotationId = `${baseId} Rev.${quotation.revisionNumber}`;
    }

    // Update fields as provided, reset user/admin information
    const updateFields = {
      projectName,
      projectLA,
      products,
      paymentTerm,
      paymentDelivery,
      note,
      excluding,
      user: null // Reset user/admin to null to require re-approval
    };

    // Clean up any fields that are empty or undefined to prevent overwriting with empty values
    Object.keys(updateFields).forEach((key) => {
      if (updateFields[key] === "" || updateFields[key] === undefined) {
        delete updateFields[key];
      } else {
        quotation[key] = updateFields[key]; // Directly assign updated values
      }
    });

    // Save the updated quotation
    await quotation.save();

  } catch (err) {
    console.error(err);
    throw new Error("Failed to update quotation!");
  } finally {
    // Revalidate and redirect as necessary
    revalidatePath("/dashboard/quotations");
    redirect("/dashboard/quotations");
  }
};

export const editQuotation = async (formData) => {
  const { id, projectName, projectLA, products, paymentTerm, paymentDelivery, note, excluding, currency } = formData;

  try {
    await connectToDB();
    const quotation = await Quotation.findById(id);

    if (!quotation) {
      throw new Error('Quotation not found');
    }

   

    // Update fields as provided, reset user/admin information
    const updateFields = {
      projectName,
      projectLA,
      products,
      paymentTerm,
      paymentDelivery,
      note,
      excluding,
      currency,
      user: null // Reset user/admin to null to require re-approval
    };

    // Clean up any fields that are empty or undefined to prevent overwriting with empty values
    Object.keys(updateFields).forEach((key) => {
      if (updateFields[key] === "" || updateFields[key] === undefined) {
        delete updateFields[key];
      } else {
        quotation[key] = updateFields[key]; // Directly assign updated values
      }
    });

   

    // Save the updated quotation
    await quotation.save();

  } catch (err) {
    console.error(err);
    throw new Error("Failed to update quotation!");
  } finally {
    // Revalidate and redirect as necessary
    revalidatePath("/dashboard/quotations");
    redirect("/dashboard/quotations");
  }
};


export const updateQuotationApprove = async (formData) => {
  const { id, projectName, projectLA, products, paymentTerm, paymentDelivery, note, excluding, user } = formData;

  try {
    // Connect to the database
    await connectToDB();

    const quotation = await Quotation.findById(id);
    

    const updateFields = {
      projectName,
      projectLA,
      products,
      paymentTerm,
      paymentDelivery,
      note,
      excluding,
      ...(user && { user }) 
    };

    Object.keys(updateFields).forEach(
      (key) => (updateFields[key] === "" || updateFields[key] === undefined) && delete updateFields[key]
    );

    Object.assign(quotation, updateFields);

    await quotation.save();


  } catch (err) {
    console.error(err);
    throw new Error("Failed to update quotation!");
  } finally {
    revalidatePath("/dashboard/approves");
    redirect("/dashboard/approves");
  }
};



/*
export const deleteQuotation = async (formData) => {
  const { id } = Object.fromEntries(formData);

  try {
     connectToDB();        
    await Quotation.findByIdAndDelete(id)

  } catch (err) {
    console.log(err)
    throw new Error('failed to delete Quotation!')
  }

  revalidatePath("/dashboard/quotations");
};*/

export const deleteQuotation = async (formData) => {
  const { id } = Object.fromEntries(formData);

  try {
    await connectToDB();        
    await Quotation.deleteOne({ quotationId: id });
  } catch (err) {
    console.log(err);
    throw new Error('Failed to delete Quotation!');
  }

  revalidatePath("/dashboard/quotations");
};



export const deletePoApprove = async (formData) => {
  const { id } = Object.fromEntries(formData);

  try {
     connectToDB();        
    await ApprovePo.findByIdAndDelete(id)

  } catch (err) {
    console.log(err)
    throw new Error('failed to delete ApprovePo!')
  }

  revalidatePath("/dashboard/approvePo");
};

export const addCoc = async (formData) => {
  const { saleId, clientId,quotationId, jobOrderId, products, deliveryLocation} = formData;

  try {
    await connectToDB();

    const jobOrder = await JobOrder.findById(jobOrderId);
    if (!jobOrder) {
      throw new Error('job not found');
    }


    const sale = await Sale.findById(saleId);
    if (!sale) {
      throw new Error('Sale not found');
    }

    const client = await Client.findById(clientId);
    if (!client) {
      throw new Error('Client not found');
    }

    const quotation = await Quotation.findById(quotationId);
    if (!quotation) {
      throw new Error('Quotation not found');
    }

    const year = new Date().getFullYear();
    


// Find the latest quotation for the current year
const latestCoc = await Coc.findOne({
  cocId: { $regex: `SVSCOC-${year}-` }
}).sort({ cocId: -1 });

// Generate new sequence number
let sequenceNumber = '001';
if (latestCoc) {
  const currentNumber = parseInt(latestCoc.cocId.split('-')[2]);
  sequenceNumber = String(currentNumber + 1).padStart(3, '0');
}
    const customCocId = `SVSCOC-${year}-${sequenceNumber}`;

    const newCoc = new Coc({
      client: client._id,
      quotation: quotation._id,
      sale: sale._id,
      jobOrder: jobOrder._id,
      products,
      deliveryLocation,
      cocId:customCocId,
      revisionNumber: 0,
        });

    const savedCoc = await newCoc.save();
    console.log('Coc added successfully:', savedCoc);

    return { success: true, cocId: customCocId }; // ✅ important

  } catch (err) {
    console.error("Error adding coc:", err.message);
    throw new Error('Failed to add Coc!');
  } 
};


export const updateCoc = async (formData) => {
  const { id, clientName, projectName, projectLA, products, deliveryLocation } = formData;

  try {
    await connectToDB();

    const coc = await Coc.findById(id);
    if (!coc) {
      throw new Error('Coc not found');
    }

    coc.revisionNumber += 1;

    if (coc.cocId) {
      const baseId = coc.cocId.split(" Rev.")[0];
      coc.cocId = `${baseId} Rev.${coc.revisionNumber}`;
    }
    // Add user: null to reset user/admin information on each update
    const updateFields = {
      clientName,
      projectName,
      projectLA,
      products,
      deliveryLocation,
      user: null
    };

    Object.keys(updateFields).forEach(
      key => (updateFields[key] === "" || updateFields[key] === undefined) && delete updateFields[key]
    );

    Object.assign(coc, updateFields);

    await coc.save();
  } catch (err) {
    console.error(err);
    throw new Error("Failed to update coc!");
  } finally {
    revalidatePath("/dashboard/pl_coc/coc");
    redirect("/dashboard/pl_coc/coc");
  }
};


export const deleteCoc = async (formData) => {
  const { id } = Object.fromEntries(formData);

  try {
     connectToDB();        
    await Coc.deleteOne({cocId: id});


  } catch (err) {
    console.log(err)
    throw new Error('failed to delete coc!')
  }

  revalidatePath("/dashboard/pl_coc/coc");
};


export const addPickList = async (formData) => {
  const { saleId, clientId,quotationId, jobOrderId, products,deliveryLocation } = formData;

  try {
    await connectToDB();


    const jobOrder = await JobOrder.findById(jobOrderId);
    if (!jobOrder) {
      throw new Error('job not found');
    }


    const sale = await Sale.findById(saleId);
    if (!sale) {
      throw new Error('Sale not found');
    }

    const client = await Client.findById(clientId);
    if (!client) {
      throw new Error('Client not found');
    }

    const quotation = await Quotation.findById(quotationId);
    if (!quotation) {
      throw new Error('Quotation not found');
    }


    const year = new Date().getFullYear();


      // Find the latest quotation for the current year
      const latestPicklist = await Pl.findOne({
        pickListId: { $regex: `SVSPL-${year}-` }
      }).sort({ pickListId: -1 });
  
      // Generate new sequence number
      let sequenceNumber = '001';
      if (latestPicklist) {
        const currentNumber = parseInt(latestPicklist.pickListId.split('-')[2]);
        sequenceNumber = String(currentNumber + 1).padStart(3, '0');
      }

    const customPickListIdId = `SVSPL-${year}-${sequenceNumber}`;

    const newPickList = new Pl({
      client: client._id,
      quotation: quotation._id,
      sale: sale._id,
      jobOrder: jobOrder._id,
      products,
      deliveryLocation,
      pickListId: customPickListIdId,
      revisionNumber: 0,
    });

    const savedpl = await newPickList.save();
    console.log('pl added successfully:', newPickList);

    return savedpl;
  } catch (err) {
    console.error("Error adding pl:", err.message);
    throw new Error('Failed to add pl!');
  } finally {
    revalidatePath("/dashboard/pl_coc/pl");
    redirect("/dashboard/pl_coc/pl");
  }
};



export const updatePl = async (formData) => {
  const { id,clientName, projectName, projectLA, products,deliveryLocation } = formData;

  try {
    await connectToDB();

    const pl = await Pl.findById(id);
    if (!pl) {
      throw new Error('Pl not found');
    }

    pl.revisionNumber += 1;

    if (pl.pickListId) {
      const baseId = pl.pickListId.split(" Rev.")[0];
      pl.pickListId = `${baseId} Rev.${pl.revisionNumber}`;
    }

    const updateFields = {
      clientName,
      projectName,
      projectLA,
      products,
      deliveryLocation,
    };

    Object.keys(updateFields).forEach(
      (key) => (updateFields[key] === "" || updateFields[key] === undefined) && delete updateFields[key]
    );

    Object.assign(pl, updateFields);

    await pl.save();
  } catch (err) {
    console.error(err);
    throw new Error("Failed to update pl!");
  } finally {
    revalidatePath("/dashboard/pl_coc/pl");
    redirect("/dashboard/pl_coc/pl");
  }
};




export const deletePl = async (formData) => {
  const { id } = Object.fromEntries(formData);

  try {
     connectToDB();        
    await Pl.deleteOne({pickListId: id})


  } catch (err) {
    console.log(err)
    throw new Error('failed to delete pl!')
  }

  revalidatePath("/dashboard/pl_coc/pl");
};




export const addPurchaseOrder = async (formData) => {

  const {
    saleId,
    supplierId,
    quotationId,
    products,
    paymentTerm,
    paymentDelivery,
    deliveryLocation,
    note,

  } = formData

  try {
   await connectToDB();

   const year = new Date().getFullYear();
   // Find the latest quotation for the current year
   const latestPurchaseOrder = await PurchaseOrder.findOne({
    purchaseId: { $regex: `SVSPO-${year}-` }
  }).sort({ purchaseId: -1 });

  // Generate new sequence number
  let sequenceNumber = '001';
  if (latestPurchaseOrder) {
    const currentNumber = parseInt(latestPurchaseOrder.purchaseId.split('-')[2]);
    sequenceNumber = String(currentNumber + 1).padStart(3, '0');
  }

   const customPurchaseId = `SVSPO-${year}-${sequenceNumber}`;

   const sale = await Sale.findById(saleId);
   if (!sale) {
     throw new Error('Sale not found');
   }
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      throw new Error('Supplier not found');
    }
    const quotation = await Quotation.findById(quotationId);
    if (!quotation) {
      throw new Error('Quotation not found');
    }





    const newPurchaseOrder = new PurchaseOrder({
      sale: sale._id,
      supplier: supplier._id,
      quotation:quotation._id,
      products,
      paymentTerm,
      paymentDelivery,
      deliveryLocation,
      note,
      purchaseId:customPurchaseId,
      revisionNumber: 0


    });


        await newPurchaseOrder.save();



    return { success: true, purchaseId: customPurchaseId }; // ✅ important


  } catch (err) {
    console.error("Error adding purchase order:", err.message);
    return { success: false, error: err.message }; // ✅ safe failure response
  }
};

 





export const updatePurchaseOrder = async (formData) => {
  const {
    id,
    supplierName,
    quotationNumber,
    products,
    paymentTerm,
    paymentDelivery,
    deliveryLocation,
    note,
  } = formData;  

  try {
    await connectToDB();
 
    // Find the document by ID
    const purchaseOrder = await PurchaseOrder.findById(id);
    if (!purchaseOrder) {
      throw new Error('PurchaseOrder not found');
    }

    // Increment the revision number
    purchaseOrder.revisionNumber = purchaseOrder.revisionNumber + 1;

    // Construct a new revision ID
    if (purchaseOrder.purchaseId) {
      const baseId = purchaseOrder.purchaseId.split(" Rev.")[0];
      purchaseOrder.purchaseId = `${baseId} Rev.${purchaseOrder.revisionNumber}`;
    }

    // Prepare fields to update
    const updateFields = {
      supplierName,
      quotationNumber,
      products,
      paymentTerm,
      paymentDelivery,
      deliveryLocation,
      note,
      user: null // Reset user to ensure re-approval is required
    };

    // Clean up any undefined or empty fields
    Object.keys(updateFields).forEach(
      (key) => {
        if (updateFields[key] === "" || updateFields[key] === undefined) {
          delete updateFields[key];
        } else {
          purchaseOrder[key] = updateFields[key]; // Update fields directly
        }
      }
    );

    // Save the updated document
    await purchaseOrder.save();

  } catch (err) {
    console.error(err);
    throw new Error("Failed to update purchase!");
  } finally {
    revalidatePath("/dashboard/purchaseOrder");
    redirect("/dashboard/purchaseOrder");
  }
};



export const editPurchaseOrder = async (formData) => {
  const {
    id,
    supplierName,
    quotationNumber,
    products,
    paymentTerm,
    paymentDelivery,
    deliveryLocation,
    note,
  } = formData;  

  try {
    await connectToDB();
 
    // Find the document by ID
    const purchaseOrder = await PurchaseOrder.findById(id);
    if (!purchaseOrder) {
      throw new Error('PurchaseOrder not found');
    }



    // Prepare fields to update
    const updateFields = {
      supplierName,
      quotationNumber,
      products,
      paymentTerm,
      paymentDelivery,
      deliveryLocation,
      note,
      user: null // Reset user to ensure re-approval is required
    };

    // Clean up any undefined or empty fields
    Object.keys(updateFields).forEach(
      (key) => {
        if (updateFields[key] === "" || updateFields[key] === undefined) {
          delete updateFields[key];
        } else {
          purchaseOrder[key] = updateFields[key]; // Update fields directly
        }
      }
    );

    // Save the updated document
    await purchaseOrder.save();

  } catch (err) {
    console.error(err);
    throw new Error("Failed to update purchase!");
  } finally {
    revalidatePath("/dashboard/purchaseOrder");
    redirect("/dashboard/purchaseOrder");
  }
};






export const deletePurchseOrder = async (formData) => {
  const { id } = Object.fromEntries(formData);

  try {
       connectToDB();        
    await PurchaseOrder.deleteOne({purchaseId: id})

  } catch (err) {
    console.log(err)
    throw new Error('failed to delete Po!')
  }

  revalidatePath("/dashboard/purchaseOrder");
};




export const updatePurchaseOrderApproval = async (formData) => {
  const {
    id,
    supplierName,
    quotationNumber,
    products,
    paymentTerm,
    paymentDelivery,
    deliveryLocation,
    note,
    user,
  } = formData;  
  try {
   await connectToDB();

   const purchaseOrder = await PurchaseOrder.findById(id);
    if (!purchaseOrder) {
      throw new Error('PurchaseOrder not found');
    }

  
   
      const updateFields = {
        supplierName,
        quotationNumber,
        products,
        paymentTerm,
        paymentDelivery,
        deliveryLocation,
        note,
        ...(user && { user }) 

      };

      Object.keys(updateFields).forEach(
        (key) =>
        (updateFields[key] === "" || undefined) && delete updateFields[key]
      );
      await PurchaseOrder.findByIdAndUpdate(id, updateFields);

      await purchaseOrder.save();

    } catch (err) {
      console.error(err);
      throw new Error("Failed to update purchase!");
    } finally {
      revalidatePath("/dashboard/approvePo");
      redirect("/dashboard/approvePo");
    }
  };


  export const updateCocApproval = async (formData) => {
    const { id,clientName, projectName, projectLA, products,deliveryLocation,user} = formData;
  
    try {
      await connectToDB();
  
      const coc = await Coc.findById(id);
      if (!coc) {
        throw new Error('Coc not found');
      }
  
      const updateFields = {
        clientName,
        projectName,
        projectLA,
        products,
        deliveryLocation,
        ...(user && { user }) 
  
      }
  
      Object.keys(updateFields).forEach(
        (key) => (updateFields[key] === "" || updateFields[key] === undefined) && delete updateFields[key]
      );
  
      Object.assign(coc, updateFields);
  
      await coc.save();
    } catch (err) {
      console.error(err);
      throw new Error("Failed to update coc!");
    } finally {
      revalidatePath("/dashboard/approveCoc");
      redirect("/dashboard/approveCoc");
    }
  };
  


  export const authenticate = async (prevState, formData) => {
    const { username, password } = Object.fromEntries(formData);
    
    try {
      // First, manually fetch the user to get the role
      await connectToDB();
      const user = await User.findOne({ username });
      
      if (!user) {
        return { error: "Wrong Credentials" };
      }
      
      const isPasswordCorrect = await bcrypt.compare(
        password,
        user.password
      );
      
      if (!isPasswordCorrect) {
        return { error: "Wrong Credentials" };
      }
      
      // Now sign in
      const result = await signIn("credentials", { 
        username, 
        password,
        redirect: false 
      });
      
      if (result?.error) {
        return { error: "Authentication failed" };
      }
      
      return { 
        success: true,
        userRole: user.role
      };
    } catch (error) {
      return { error: error?.message || "Authentication failed" };
    }
  };
