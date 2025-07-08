"use server";
import { revalidatePath } from "next/cache";
import { connectToDB } from "./utils";
import { redirect } from "next/navigation";
import bcrypt from 'bcrypt';
import { auth } from "@/app/api/auth/[...nextauth]/route";

import {
  gregorianToHijri as toHijriObj,
  hijriToGregorian as toGregorianObj
} from '@tabby_ai/hijri-converter';
import { ROLES } from "./role";




const { User, Client, Supplier, PurchaseOrder, Quotation, JobOrder, Sale, Coc, Pl, Approve, ApprovePo, Employee, Task, Ticket, Leave, Shift } = require('@/app/lib/models')


export const addUser = async (formData) => {
  const { username, email, password, phone, address, isActive, role, employeeId } = Object.fromEntries(formData);
  console.log("Role submitted:", role);
  console.log("Employee ID submitted:", employeeId);

  try {
    await connectToDB();

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashPassword,
      phone,
      address,
      role,
      isActive,
      employee: employeeId, // ✅ link user to selected employee
    });

    await newUser.save();
  } catch (err) {
    console.log(err);
    throw new Error('Failed to add user!');
  }

  revalidatePath("/dashboard/users");
  redirect("/dashboard/users");
};

export const updateUser = async (formData) => {
  const { id, username, email, password, phone, address, role, isActive, employeeId } =
    Object.fromEntries(formData);

  try {
    await connectToDB();

    const updateFields = {
      username,
      email,
      phone,
      address,
      role,
      isActive,
    };

    if (employeeId) {
      updateFields.employee = employeeId; // ✅ update employee link
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash(password, salt);
      updateFields.password = hashPassword;
    }

    // Remove empty or undefined fields to avoid overwriting with empty values
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

export const addLeave = async ({ 
  employeeId,
  contactMobile,
  leaveType,
  startDate,
  endDate,
  addressWhileOnVacation,
  exitReentryVisa,
}) => {
  try {
    await connectToDB();

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    const leaveStart = new Date(startDate);
    const leaveEnd = new Date(endDate);
    const daysRequested = Math.ceil((leaveEnd - leaveStart) / (1000 * 60 * 60 * 24)) + 1;

    // DO NOT DEDUCT BALANCE HERE!

    const newLeave = new Leave({
      employee: employeeId,
      contactMobile,
      leaveType,
      startDate,
      endDate,
      addressWhileOnVacation,
      leaveBalance: employee.leaveBalance, // snapshot at request time (unchanged)
      exitReentryVisa,
      approvals: {
        admin: {
          approved: false,
          approvedBy: null,
          approvedAt: null,
          rejected: false,
          rejectedBy: null,
          rejectedAt: null,
          rejectionReason: null,
        },
        hrAdmin: {
          approved: false,
          approvedBy: null,
          approvedAt: null,
          rejected: false,
          rejectedBy: null,
          rejectedAt: null,
          rejectionReason: null,
        },
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await newLeave.save();
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, message: 'Failed to add Leave request!' };
  }
};



export const updateLeave = async (formData) => {
  const { 
    id,
    employeeId,
    contactMobile,
    leaveType,
    startDate,
    endDate,
    addressWhileOnVacation,
    exitReentryVisa,
  } = formData;

  try {
    await connectToDB();
    const leave = await Leave.findById(id).populate('employee');

    if (!leave) {
      throw new Error('Leave not found');
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    // Calculate old leave duration
    const oldStart = new Date(leave.startDate);
    const oldEnd = new Date(leave.endDate);
    const oldDays = Math.ceil((oldEnd - oldStart) / (1000 * 60 * 60 * 24)) + 1;

    // Restore previous days back to employee balance
    employee.leaveBalance += oldDays;

    // Calculate new leave duration
    const newStart = new Date(startDate);
    const newEnd = new Date(endDate);
    const newDays = Math.ceil((newEnd - newStart) / (1000 * 60 * 60 * 24)) + 1;

    // Deduct new days from employee balance
    employee.leaveBalance -= newDays;
    await employee.save();

    // Update fields on the leave document
    const updateFields = {
      employee: employeeId,
      contactMobile,
      leaveType,
      startDate,
      endDate,
      addressWhileOnVacation,
      exitReentryVisa,
      leaveBalance: employee.leaveBalance, // ✅ update leave snapshot with current balance
    };

    Object.entries(updateFields).forEach(([key, value]) => {
      if (value !== "" && value !== undefined) {
        leave[key] = value;
      }
    });

    // Reset approvals
    leave.approvals = {
      admin: { approved: false, approvedBy: null, approvedAt: null, rejected: false, rejectedBy: null, rejectionReason: null },
      hrAdmin: { approved: false, approvedBy: null, approvedAt: null, rejected: false, rejectedBy: null, rejectionReason: null },
    };

    await leave.save();

    return { success: true, leave };
  } catch (err) {
    console.error(err);
    return { success: false, message: "Failed to update leave!" };
  } 
};


export const addShift = async ({
  employeeId,
  date,
  shiftType,
  startTime,
  endTime,
  location,
}) => {
  try {
    await connectToDB();

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    const newShift = new Shift({
      employee: employeeId,
      date,
      shiftType,
      startTime,
      endTime,
      location,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await newShift.save();
    return { success: true };
  } catch (err) {
    console.error('addShift error:', err);
    return { success: false, message: 'Failed to add Shift!' };
  }
};


export const deleteShift = async (formData) => {
  const { id } = Object.fromEntries(formData);

  try {
    await connectToDB();        
    await Shift.deleteOne({ shiftId: id });
  } catch (err) {
    console.log(err);
    throw new Error('Failed to delete Shift!');
  }

  revalidatePath("/hr_dashboard/sifts");
};

/*
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

*/


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
  dateFormat
}) => {
  try {
    await connectToDB();

    let initialLeaveBalance = 0;

    if (contractStartDate) {
      const parsedStart = new Date(contractStartDate);
      if (!isNaN(parsedStart)) {
        const today = new Date();
        const monthsWorked = Math.max(0, (today.getFullYear() - parsedStart.getFullYear()) * 12 + today.getMonth() - parsedStart.getMonth());
        initialLeaveBalance = Math.min(monthsWorked * 2.5); // cap at 30 if desired
      }
    }

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
      dateFormat,
      leaveBalance: initialLeaveBalance, // ✅ SET INITIAL BALANCE
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
    let sequenceNumber = '050';
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




export const addSupplier = async ({ name, phone, contactName, contactMobile, email, VAT, CR, address }) => {
  try {
    connectToDB();
    const year = new Date().getFullYear();

    const latestSupplier = await Supplier.findOne({
      supplierId: { $regex: `^SVS-VN-${year}-\\d{3}$` } // strict 3-digit sequence
    }).sort({ supplierId: -1 });

    let sequenceNumber = '001';
    if (latestSupplier) {
const match = latestSupplier.supplierId.match(/^SVS-VN-\d{4}-(\d{3})$/);
      if (match) {
        const currentNumber = parseInt(match[1], 10);
        sequenceNumber = String(currentNumber + 1).padStart(3, '0');
      }
    }

    const customSupplierId = `SVS-VN-${year}-${sequenceNumber}`;

    const newSupplier = new Supplier({
      name,
      phone,
      contactName,
      contactMobile,
      email,
      VAT,
      CR,
      address,
      supplierId: customSupplierId,
    });

    await newSupplier.save();
    revalidatePath("/dashboard/suppliers");
    return { success: true };
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      const value = err.keyValue[field];
      return { success: false, message: `A supplier with the same ${field} "${value}" already exists.` };
    }
    return { success: false, message: 'Failed to add supplier!' };
  }
};


/*
export const addSupplier = async ({ name, phone, contactName, contactMobile, email, VAT, CR,address }) => {
 

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


const customSupplierId = `SVS-S-${year}-${sequenceNumber}`;




    const newSupplier = new Supplier({
      name,
      phone,
      contactName,
      contactMobile,
      email,
      VAT,
      CR,
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
*/

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
  const { id, name, phone, contactName, contactMobile, email,VAT,CR, address } =
    Object.fromEntries(formData);

  try {
     connectToDB();

    const updateFields = {
      name,
      phone,
      contactName,
      contactMobile,
      email,
      VAT,
      CR,
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
export const approveLeave = async ({ leaveId, role }) => {
  const session = await auth();
  const currentUser = session?.user;

  if (!currentUser) {
    throw new Error("You must be signed in to approve leaves.");
  }

  if (role === 'Admin' && currentUser.role !== ROLES.ADMIN) {
    throw new Error("Only Admins can approve as Admin.");
  }
  if (role === 'HRAdmin' && currentUser.role !== ROLES.HR_ADMIN) {
    throw new Error("Only HR Admins can approve as HR Admin.");
  }

  const approvalsPath = role === 'HRAdmin' ? 'hrAdmin' : 'admin';

  try {
    const updatedLeave = await Leave.findByIdAndUpdate(
      leaveId,
      {
        $set: {
          [`approvals.${approvalsPath}.approved`]: true,
          [`approvals.${approvalsPath}.approvedAt`]: new Date(),
          [`approvals.${approvalsPath}.approvedBy`]: currentUser.id,
          updatedAt: new Date(),
        },
      },
      { new: true }
    )
    .populate("employee", "name")
    .populate(`approvals.${approvalsPath}.approvedBy`, "username");

    if (!updatedLeave) throw new Error("Leave not found!");

    const plainLeave = updatedLeave.toObject();

    revalidatePath("/hr_dashboard/leaves"); // ✅ keep this!

    return { success: true, leave: plainLeave };

  } catch (err) {
    console.error("Error approving leave:", err);
    throw new Error('Failed to approve leave!');
  }
};
*/


export const approveLeave = async ({ leaveId, role }) => {
  const session = await auth();
  const currentUser = session?.user;

  if (!currentUser) throw new Error("You must be signed in to approve leaves.");
  if (role === 'Admin' && currentUser.role !== ROLES.ADMIN) {
    throw new Error("Only Admins can approve as Admin.");
  }
  if (role === 'HRAdmin' && currentUser.role !== ROLES.HR_ADMIN) {
    throw new Error("Only HR Admins can approve as HR Admin.");
  }

  const approvalsPath = role === 'HRAdmin' ? 'hrAdmin' : 'admin';

  try {
    // ✅ First, mark this approval
    const updatedLeave = await Leave.findByIdAndUpdate(
      leaveId,
      {
        $set: {
          [`approvals.${approvalsPath}.approved`]: true,
          [`approvals.${approvalsPath}.approvedAt`]: new Date(),
          [`approvals.${approvalsPath}.approvedBy`]: currentUser.id,
          updatedAt: new Date(),
        },
      },
      { new: true }
    )
    .populate("employee")
    .populate(`approvals.${approvalsPath}.approvedBy`, "username");

    if (!updatedLeave) throw new Error("Leave not found!");

    // ✅ Check if both approvals are now granted
   // ✅ Reload latest leave after marking approval, to get fresh state
const latestLeave = await Leave.findById(leaveId).populate('employee');
if (!latestLeave) throw new Error("Leave not found after approval update!");

// ✅ Check if both approvals are granted and deduction not yet done
if (
  latestLeave.approvals.admin.approved &&
  latestLeave.approvals.hrAdmin.approved &&
  !latestLeave.balanceDeducted
) {
  const employee = await Employee.findById(latestLeave.employee._id);
  if (!employee) throw new Error("Employee not found!");

  const leaveStart = new Date(latestLeave.startDate);
  const leaveEnd = new Date(latestLeave.endDate);

  if (isNaN(leaveStart) || isNaN(leaveEnd) || leaveEnd < leaveStart) {
    throw new Error("Invalid leave start/end dates.");
  }


    latestLeave.pastLeaveBalance = employee.leaveBalance;

    
  const daysRequested = Math.ceil((leaveEnd - leaveStart) / (1000 * 60 * 60 * 24)) + 1;

  employee.leaveBalance -= daysRequested;
  await employee.save();

  latestLeave.leaveBalance = employee.leaveBalance;
  latestLeave.balanceDeducted = true; // ✅ ensure one-time deduction
  await latestLeave.save();
}

// ✅ Revalidate based on user role
if (currentUser.role === ROLES.HR_ADMIN) {
  revalidatePath("/hr_dashboard/leaves");
} else {
  revalidatePath("/dashboard/leaves");
}

    const plainLeave = latestLeave.toObject();
    return { success: true, leave: plainLeave };

  } catch (err) {
    console.error("Error approving leave:", err);
    throw new Error('Failed to approve leave!');
  }
};


export const rejectLeave = async ({ leaveId, role, reason }) => {
  const session = await auth();
  const currentUser = session?.user;

  if (!currentUser) {
    throw new Error("You must be signed in to reject leaves.");
  }

  if (role === 'Admin' && currentUser.role !== ROLES.ADMIN) {
    throw new Error("Only Admins can reject as Admin.");
  }
  if (role === 'HRAdmin' && currentUser.role !== ROLES.HR_ADMIN) {
    throw new Error("Only HR Admins can reject as HR Admin.");
  }

  if (!reason || reason.trim() === "") {
    throw new Error("A rejection reason is required.");
  }

  const approvalsPath = role === 'HRAdmin' ? 'hrAdmin' : 'admin';

  try {
    const updatedLeave = await Leave.findByIdAndUpdate(
      leaveId,
      {
        $set: {
          [`approvals.${approvalsPath}.rejected`]: true,
          [`approvals.${approvalsPath}.rejectedAt`]: new Date(),
          [`approvals.${approvalsPath}.rejectedBy`]: currentUser.id,
          [`approvals.${approvalsPath}.rejectionReason`]: reason,
          updatedAt: new Date(),
        },
      },
      { new: true }
    )
    .populate("employee", "name")
    .populate(`approvals.${approvalsPath}.rejectedBy`, "username");

    if (!updatedLeave) throw new Error("Leave not found!");

    const plainLeave = updatedLeave.toObject();

    revalidatePath("/hr_dashboard/leaves"); // ✅ ensures UI refresh

    return { success: true, leave: plainLeave };

  } catch (err) {
    console.error("Error rejecting leave:", err);
    throw new Error('Failed to reject leave!');
  }
};



export const addQuotation = async (formData) => {
  const { saleId, clientId, projectName, projectLA, products, paymentTerm, paymentDelivery, note, validityPeriod, excluding, currency } = formData;

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
      currency,
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



export async function updatePurchaseOrderPayment(poId, newRemaining, status) {
  await connectToDB();

  const po = await PurchaseOrder.findById(poId);
  if (!po) throw new Error("Purchase order not found");

  po.remainingAmount = newRemaining;
  po.paymentStatus = status;  // optional if you have a paymentStatus field
  await po.save();

  return { success: true };
}

export const addPurchaseOrder = async (formData) => {

  const {
    userId,
    supplierId,
    jobOrderId,
    products,
    paymentTerm,
    deliveryLocation,
    sellingPolicy,
    deliveryTerm,
    validityPeriod,
    delayPenalties,
    totalPrice,
    currency,
  } = formData

  try {
   await connectToDB();

   const year = new Date().getFullYear();
   // Find the latest quotation for the current year
   const latestPurchaseOrder = await PurchaseOrder.findOne({
    purchaseId: { $regex: `SVSPO-${year}-` }
  }).sort({ purchaseId: -1 });

  // Generate new sequence number
  let sequenceNumber = '063';
  if (latestPurchaseOrder) {
    const currentNumber = parseInt(latestPurchaseOrder.purchaseId.split('-')[2]);
    sequenceNumber = String(currentNumber + 1).padStart(3, '0');
  }

   const customPurchaseId = `SVSPO-${year}-${sequenceNumber}`;

   const userPro = await User.findById(userId);
   if (!userPro) {
     throw new Error('User Pro not found');
   }
   
 
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      throw new Error('Supplier not found');
    }

    

    const jobOrder = await JobOrder.findById(jobOrderId);
    if (!jobOrder) {
      throw new Error('job not found');
    }







    const newPurchaseOrder = new PurchaseOrder({
      userPro: userPro._id,
      supplier: supplier._id,
      jobOrder: jobOrder._id,
      products,
      totalPrice,
      paymentTerm,
        remainingAmount: totalPrice, 
      deliveryLocation,
     sellingPolicy,
     deliveryTerm,
     validityPeriod,
     delayPenalties,
      purchaseId:customPurchaseId,
      currency,
      revisionNumber: 0


    });


        await newPurchaseOrder.save();



    return { success: true, purchaseId: customPurchaseId }; // ✅ important


  } catch (err) {
    console.error("Error adding purchase order:", err.message);
    return { success: false, error: err.message }; // ✅ safe failure response
  }
};


export const getAssignedTasks = async () => {
  await connectToDB();
  const session = await auth();
  if (!session || !session.user?.id) throw new Error("Not authenticated");

  const userId = session.user.id;

  const tasks = await Task.find({
    createdBy: userId,
    assignedTo: { $exists: true, $ne: userId }, // assigned to someone else
  })
    .populate('assignedTo', 'username email')
    .select('title status deadline assignedTo _id')
    .sort({ deadline: 1 })
    .lean();

  return tasks.map(task => ({
    id: task._id.toString(),
    title: task.title,
    status: task.status,
    deadline: task.deadline?.toISOString().split('T')[0] || '—',
    assignedTo: task.assignedTo
      ? (task.assignedTo.username || task.assignedTo.email || 'Unassigned')
      : 'Unassigned',
  }));
};



export const getTasks = async () => {
  await connectToDB();

  const session = await auth(); // this gives you the current user session
  if (!session || !session.user?.id) {
    return []; // or throw new Error("Not authenticated");
  }

  const tasks = await Task.find({ assignedTo: session.user.id })
    .select('title status deadline _id')
    .sort({ deadline: 1 });

  return tasks.map(task => ({
    id: task._id.toString(),
    title: task.title,
    status: task.status,
    deadline: task.deadline?.toISOString().split('T')[0] || '—',
  }));
};


export const getLeaveRequests = async () => {
  await connectToDB();

  const session = await auth();
  if (!session || !session.user?.id) {
    return []; // Or throw an error if you want
  }

  const leaves = await Leave.find({ employee: session.user.id })
    .select('leaveType startDate endDate status approvals _id')
    .sort({ createdAt: -1 });

  return leaves.map(leave => ({
    id: leave._id.toString(),
    leaveType: leave.leaveType,
    startDate: leave.startDate?.toISOString().split('T')[0] || '—',
    endDate: leave.endDate?.toISOString().split('T')[0] || '—',
    status: determineLeaveStatus(leave),
  }));
};

// Helper to determine status from approvals
const determineLeaveStatus = (leave) => {
  if (leave.approvals?.admin?.rejected || leave.approvals?.hrAdmin?.rejected) {
    return 'Rejected';
  }
  if (leave.approvals?.admin?.approved && leave.approvals?.hrAdmin?.approved) {
    return 'Approved';
  }
  return 'Pending';
};




export const getTaskById = async (id) => {
  await connectToDB();
  const task = await Task.findById(id)
    .populate('assignedTo', 'username') // populate assigned user
    .populate('createdBy', 'username')  // populate creator user
    .select('title description status deadline assignedTo createdBy');

  if (!task) throw new Error("Task not found");

  return {
    id: task._id.toString(),
    title: task.title,
    description: task.description,
    status: task.status,
    deadline: task.deadline?.toISOString().split('T')[0] || '—',
    assignedTo: task.assignedTo 
      ? (task.assignedTo.username || task.assignedTo.email || task.assignedTo.toString())
      : 'Unassigned',
    createdBy: task.createdBy
      ? (task.createdBy.username || task.createdBy.email || task.createdBy.toString())
      : 'Unknown',
  };
};


export const markTaskAsDone = async (id) => {
  await connectToDB();

  const task = await Task.findById(id);
  if (!task) throw new Error("Task not found");

  task.status = 'done';
  await task.save();

  return {
    id: task._id.toString(),
    title: task.title,
    description: task.description,
    status: task.status,
    deadline: task.deadline?.toISOString().split('T')[0] || '—',
  };
};



export const markTicketsAsDone = async (id) => {
  await connectToDB();

  const ticket = await Ticket.findById(id);
  if (!ticket) throw new Error("Ticket not found");

  ticket.status = 'done';
  await ticket.save();

  return {
    id: ticket._id.toString(),
    title: ticket.title,
    description: ticket.description,
    status: ticket.status,
    deadline: ticket.deadline?.toISOString().split('T')[0] || '—',
  };
};




export const getAssignedTickets = async () => {
  await connectToDB();
  const session = await auth();
  if (!session || !session.user?.id) throw new Error("Not authenticated");

  const userId = session.user.id;

  const tickets = await Ticket.find({
    createdBy: userId,
    assignedTo: { $exists: true, $ne: userId }, // assigned to someone else
  })
    .populate('assignedTo', 'username email')
    .select('title status deadline assignedTo _id')
    .sort({ deadline: 1 })
    .lean();

  return tickets.map(ticket => ({
    id: ticket._id.toString(),
    title: ticket.title,
    status: ticket.status,
    deadline: ticket.deadline?.toISOString().split('T')[0] || '—',
    assignedTo: ticket.assignedTo
      ? (ticket.assignedTo.username || ticket.assignedTo.email || 'Unassigned')
      : 'Unassigned',
  }));
};



export const getTickets = async () => {
  await connectToDB();

  const session = await auth(); // this gives you the current user session
  if (!session || !session.user?.id) {
    return []; // or throw new Error("Not authenticated");
  }

  const tickets = await Ticket.find({ assignedTo: session.user.id })
    .select('title status deadline _id')
    .sort({ deadline: 1 });

  return tickets.map(ticket => ({
    id: ticket._id.toString(),
    title: ticket.title,
    status: ticket.status,
    deadline: ticket.deadline?.toISOString().split('T')[0] || '—',
  }));
};



export const getTicketById = async (id) => {
  await connectToDB();
  const ticket = await Ticket.findById(id)
    .populate('assignedTo', 'username') // populate assigned user
    .populate('createdBy', 'username')  // populate creator user
    .select('title description status deadline assignedTo createdBy');

  if (!ticket) throw new Error("Ticket not found");

  return {
    id: ticket._id.toString(),
    title: ticket.title,
    description: ticket.description,
    status: ticket.status,
    deadline: ticket.deadline?.toISOString().split('T')[0] || '—',
    assignedTo: ticket.assignedTo 
      ? (ticket.assignedTo.username || ticket.assignedTo.email || ticket.assignedTo.toString())
      : 'Unassigned',
    createdBy: ticket.createdBy
      ? (ticket.createdBy.username || ticket.createdBy.email || ticket.createdBy.toString())
      : 'Unknown',
  };
};


export const markTicketAsDone = async (id) => {
  await connectToDB();

  const ticket = await Ticket.findById(id);
  if (!ticket) throw new Error("Ticket not found");

  ticket.status = 'done';
  await ticket.save();

  return {
    id: ticket._id.toString(),
    title: ticket.title,
    description: ticket.description,
    status: ticket.status,
    deadline: ticket.deadline?.toISOString().split('T')[0] || '—',
  };
};







export const updatePurchaseOrder = async (formData) => {
  const {
    id,
    supplierName,
    products,
    paymentTerm,
    paymentDelivery,
    deliveryLocation,
    sellingPolicy,
    deliveryTerm,
    validityPeriod,
    delayPenalties,
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
    deliveryLocation,
    sellingPolicy,
    deliveryTerm,
    validityPeriod,
    delayPenalties, 
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
    products,
    paymentTerm,
    deliveryLocation,
    sellingPolicy,
    deliveryTerm,
    validityPeriod,
    delayPenalties,
     currency
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
      products,
      paymentTerm,
      deliveryLocation,
  sellingPolicy,
    deliveryTerm,
    validityPeriod,
    delayPenalties,   
     currency,   
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
    await connectToDB();
    const user = await User.findOne({ username });

    if (!user) {
      return { error: "Wrong credentials" };
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return { error: "Wrong credentials" };
    }

    // ✅ Just return success info; no signIn() on server
    return {
      success: true,
      userRole: user.role,
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return { error: error?.message || "Authentication failed" };
  }
};
