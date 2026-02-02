"use server";
import { revalidatePath } from "next/cache";
import { connectToDB } from "./utils";
import { redirect } from "next/navigation";
import bcrypt from 'bcrypt';
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { ROLES } from "./role";




const { User, Client, Supplier, PurchaseOrder, Quotation, JobOrder, Sale, Coc, Pl, Approve, ApprovePo, Employee, Task, Ticket, Leave, Shift, Department, Lead } = require('@/app/lib/models')


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


export const addLead = async ({
  salutation,
  name,
  email,
  agentId,
  source,
  category,
  allowFollowUp,
  status,
  currency,
  leadValue,
  note,
  companyName,
  website,
  mobile,
  officePhoneNumber,
}) => {
  try {
    const session = await auth();
    await connectToDB();


    const payload = {
      salutation: salutation || undefined,
      name,
      email: email || undefined,
      source: source || undefined,
      category: category || undefined,
      allowFollowUp: typeof allowFollowUp === 'boolean' ? allowFollowUp : true,
      status,
      currency,
      leadValue: typeof leadValue === 'number' ? leadValue : Number(leadValue) || 0,
      note: note || undefined,
      companyName: companyName || undefined,
      website: website || undefined,
      mobile: mobile || undefined,
      officePhoneNumber: officePhoneNumber || undefined,
      createdBy: session?.user?.id || undefined,
    };

    if (agentId) {
      const agent = await Sale.findById(agentId);
      if (!agent) {
        throw new Error('Selected agent does not exist');
      }
      payload.agent = agent._id;
    }

    const newLead = new Lead(payload);
    await newLead.save();

    revalidatePath("/dashboard/leads");
    return { success: true, leadId: newLead._id.toString() };
  } catch (err) {
    console.error('Failed to add lead:', err);
    const message = err?.message || 'Failed to add lead!';
    return { success: false, message };
  }
};




export const addDepartment = async ({ name, directManagerId, employeeIds = [] }) => {
  try {
    await connectToDB();

    // Ensure the manager is included in employees (optional but handy)
    const employees = Array.isArray(employeeIds) && employeeIds.length
      ? Array.from(new Set([...employeeIds.map(String), String(directManagerId)]))
      : [String(directManagerId)];

    const newDepartment = new Department({
      name,
      directManager: directManagerId,
      employees,
    });

    await newDepartment.save();

    // Revalidate any pages that list departments (adjust paths to your routes)
    revalidatePath("/hr_dashboard/departments");
    revalidatePath("/dashboard/departments");

    return { success: true };
  } catch (err) {
    console.error(err);

    // Duplicate key (e.g., unique name) handling
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0] || "field";
      const value = err.keyValue?.[field];
      return {
        success: false,
        message: `A department with the same ${field} "${value}" already exists.`,
      };
    }

    // Mongoose validation message passthrough (optional)
    if (err?.errors) {
      const firstKey = Object.keys(err.errors)[0];
      const msg = err.errors[firstKey]?.message || "Validation failed";
      return { success: false, message: msg };
    }

    return { success: false, message: "Failed to add department!" };
  }
};

export const addLeave = async ({ 
  employeeId,
  contactMobile,
  leaveType,
  reason,
  startDate, 
  endDate,
  addressWhileOnVacation,
  exitReentryVisa,
}) => {
  try {
     const session = await auth();
  const currentUser = session?.user;
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
        reason,
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


    if (currentUser.role === ROLES.HR_ADMIN) {
  revalidatePath("/hr_dashboard/leaves");
} else {
  revalidatePath("/dashboard/leaves");
}

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
      reason,

    startDate,
    endDate,
    addressWhileOnVacation,
    exitReentryVisa,
  } = formData;

  try {
    await connectToDB();
    const leave = await Leave.findById(id).populate('employee');
     const session = await auth();
  const currentUser = session?.user;

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
        reason,
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


    if (currentUser.role === ROLES.HR_ADMIN) {
  revalidatePath("/hr_dashboard/leaves");
} else {
  revalidatePath("/dashboard/leaves");
}

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
      startTime,
      endTime,
      location,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await newShift.save();
    return { success: true };
  } catch (err) {
    console.error('request error:', err);
    return { success: false, message: 'Failed to add leave request ' };
  }
};




export const updateShift = async ({
  id,
  employeeId,
  date,
  startTime,
  endTime,
  location,
}) => {
  if (!id) return { success: false, message: 'Shift ID is required' };

  try {
    await connectToDB();

    const shift = await Shift.findById(id);
    if (!shift) return { success: false, message: 'Shift not found' };

    // If employee is changing, verify it exists
    let employeeDoc = null;
    if (typeof employeeId === 'string' && employeeId) {
      employeeDoc = await Employee.findById(employeeId).select('_id');
      if (!employeeDoc) return { success: false, message: 'Employee not found' };
    }

    const updateFields = {
      // only pass values that are not empty/undefined
      employee: employeeDoc?._id, // only set if provided
      date,
      startTime,
      endTime,
      location,
      updatedAt: new Date(),
    };

    Object.keys(updateFields).forEach((k) => {
      if (updateFields[k] === '' || updateFields[k] === undefined) delete updateFields[k];
    });

    await Shift.findByIdAndUpdate(id, { $set: updateFields }, { new: true });

    // Revalidate list + detail pages
    revalidatePath('/hr_dashboard/shifts');
    revalidatePath(`/hr_dashboard/shifts/${id}`);
    revalidatePath('/dashboard/shifts');

    return { success: true };
  } catch (err) {
    console.error('updateShift error:', err);
    const msg = err?.message || 'Failed to update shift!';
    return { success: false, message: msg };
  }
};


// FIX deleteShift (use _id, fix path)
export const deleteShift = async (formData) => {
  const { id } = Object.fromEntries(formData);
  if (!id) throw new Error('Shift ID is required');

  try {
    await connectToDB();
    await Shift.deleteOne({ _id: id }); // ✅ use _id, not shiftId
  } catch (err) {
    console.log(err);
    throw new Error('Failed to delete Shift!');
  }

  revalidatePath('/hr_dashboard/shifts'); // ✅ fixed path
};

/*
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


*/


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
  contractDuration,
  contractStartDate,
  contractStartDateHijri,
  contractEndDate,
  departmentId,  
  contractEndDateHijri,
  dateFormat
}) => {
  try {
    await connectToDB();

    let initialLeaveBalance = 0;

     // (Optional) verify department exists before creating the employee
    let departmentDoc = null;
    if (departmentId) {
      departmentDoc = await Department.findById(departmentId).select("_id");
      if (!departmentDoc) {
        return { success: false, message: "Selected department not found." };
      }
    }

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
      department: departmentDoc?._id || undefined,  
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
    contractDuration,
    contractStartDate,
    contractStartDateHijri,
    contractEndDate,
    contractEndDateHijri,
    dateFormat,
    departmentId,
  } = formData;

  if (!id) return { success: false, message: 'Employee ID is required' };

  try {
    await connectToDB();

    const employee = await Employee.findById(id);
    if (!employee) return { success: false, message: 'Employee not found' };

    // Build update set (strip empty strings/undefined)
    const updateFields = {
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
      contractDuration,
      contractStartDate,
      contractStartDateHijri,
      contractEndDate,
      contractEndDateHijri,
      dateFormat,
      updatedAt: new Date(),
    };

    Object.keys(updateFields).forEach((k) => {
      if (updateFields[k] === '' || updateFields[k] === undefined) delete updateFields[k];
    });

    // Department handling
    const wantsToChangeDept = typeof departmentId === 'string';
    const newDeptId = wantsToChangeDept ? (departmentId || null) : undefined;

    if (wantsToChangeDept) {
      const oldDeptId = employee.department ? employee.department.toString() : null;

      let newDeptDoc = null;
      if (newDeptId) {
        newDeptDoc = await Department.findById(newDeptId).select('_id');
        if (!newDeptDoc) {
          return { success: false, message: 'Selected department not found.' };
        }
      }

      const changed =
        (oldDeptId || null) !== (newDeptDoc?._id?.toString() ?? null);

      if (changed) {
        if (oldDeptId) {
          await Department.updateOne(
            { _id: oldDeptId },
            { $pull: { employees: employee._id } }
          );
        }
        if (newDeptDoc?._id) {
          await Department.updateOne(
            { _id: newDeptDoc._id },
            { $addToSet: { employees: employee._id } }
          );
        }
      }

      updateFields.department = newDeptDoc?._id || undefined;
    }

    await Employee.findByIdAndUpdate(id, { $set: updateFields }, { new: true });

    revalidatePath('/dashboard/employees');
    revalidatePath(`/dashboard/employees/${id}`);
    revalidatePath('/hr_dashboard/employees');
    revalidatePath('/hr_dashboard/departments');

    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, message: err?.message || 'Failed to update employee!' };
  }
};




/*
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
*/

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




export const deleteDepartmnet = async (formData) => {
  const { id } = Object.fromEntries(formData);

  try {
     connectToDB();        
    await Department.findByIdAndDelete(id)

  } catch (err) {
    console.log(err)
    throw new Error('failed to delete department!')
  }

  revalidatePath("/dashboard/departments");
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





/*
export const addJobOrder = async (formData) => {
  const {
    poNumber,
    poDate,
    clientId,
    quotationId,
    projectType,
    projectStatus
  } = formData;

  try {
    await connectToDB();

    const client = await Client.findById(clientId).lean();
    if (!client) {
      throw new Error('Client not found');
    }

    const quotation = await Quotation.findById(quotationId).lean();
    if (!quotation || quotation.client.toString() !== client._id.toString()) {
      throw new Error('Quotation not found or does not belong to the client');
    }

    const year = new Date().getFullYear();
    const latestJobOrder = await JobOrder.findOne({
      jobOrderId: { $regex: `SVSJO-${year}-` }
    }).sort({ jobOrderId: -1 });

    let sequenceNumber = '050';
    if (latestJobOrder) {
      const currentNumber = parseInt(latestJobOrder.jobOrderId.split('-')[2]);
      sequenceNumber = String(currentNumber + 1).padStart(3, '0');
    }
    const customJobOrderId = `SVSJO-${year}-${sequenceNumber}`;

    const jobOrder = new JobOrder({
      jobOrderId: customJobOrderId,
      poNumber,
      poDate,
      client: client._id,
      quotation: quotation._id,
      projectType,
      projectStatus: projectStatus || 'OPEN'
    });

    await jobOrder.save();

    const populatedJobOrder = await JobOrder.findById(jobOrder._id)
      .populate('quotation')
      .lean();

    return populatedJobOrder;
  } catch (error) {
    console.error('Error creating job order:', error);
    throw error;
  } finally {
    revalidatePath("/dashboard/jobOrder");
    redirect("/dashboard/jobOrder");
  }
};
*/



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
  latestLeave.leaveType === "Annual Leave" &&
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


/*
export const addQuotation = async (formData) => {
  const { saleId, clientId, projectName, projectLA, products, paymentTerm, paymentDelivery, note, validityPeriod, excluding, totalPrice, currency } = formData;

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
      totalPrice,
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
  const { id, projectName, projectLA, products, paymentTerm, paymentDelivery, note, excluding,totalPrice } = formData;

  try {
    await connectToDB();
    const quotation = await Quotation.findById(id);

    if (!quotation) {
      throw new Error('Quotation not found');
    }

    // Increment revision number for each update
    quotation.revisionNumber = (Number(quotation.revisionNumber) || 0) + 1;
    quotation.quotationId = buildRevisionId(
      quotation.quotationId,
      quotation.revisionNumber
    );

    // Update fields as provided, reset user/admin information
    const updateFields = {
      projectName,
      projectLA,
      products,
      paymentTerm,
      paymentDelivery,
      note,
      totalPrice,
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

*/


// Keep title only on the first row of each same-title run
function normalizeSectionTitles(products = []) {
  const out = [];
  let last;
  for (const p of products) {
    const norm = (p?.titleAbove ?? "").trim();
    const title = norm && norm !== last ? norm : undefined; // boundary only
    out.push({
      ...p,
      qty: p?.qty != null ? Number(p.qty) : p?.qty,
      unit: p?.unit != null ? Number(p.unit) : p?.unit,
      unitPrice: p?.unitPrice != null ? Number(p.unitPrice) : p?.unitPrice,
      sharedGroupId: p?.sharedGroupId ? String(p.sharedGroupId) : undefined,
      sharedGroupPrice:
        p?.sharedGroupPrice != null ? Number(p.sharedGroupPrice) : undefined,
      titleAbove: title,
    });
    if (title) last = title;
  }
  return out;
}

// Build next revision ID with an uppercase REV suffix, stripping any prior revision tag.
// If no revisionNumber is provided, keep the current ID unchanged.
function buildRevisionId(currentId, revisionNumber) {
  if (!currentId) return currentId;
  if (revisionNumber === undefined || revisionNumber === null) return currentId;
  const baseId = currentId.replace(/\s+rev\.?\s*\d*$/i, "");
  const suffix = revisionNumber > 0 ? ` REV.${revisionNumber}` : "";
  return `${baseId}${suffix}`;
}

/*
export const addQuotation = async (formData) => {
  const {
    saleId, clientId, projectName, projectLA,
    products, paymentTerm, paymentDelivery, note,
    validityPeriod, excluding, totalPrice, currency
  } = formData;

  try {
    await connectToDB();

    const sale = await Sale.findById(saleId);
    if (!sale) throw new Error("Sale not found");

    const client = await Client.findById(clientId);
    if (!client) throw new Error("Client not found");

    const year = new Date().getFullYear();
    const latestQuotation = await Quotation.findOne({
      quotationId: { $regex: `SVSSQ-${year}-` }
    }).sort({ quotationId: -1 });

    let sequenceNumber = "001";
    if (latestQuotation) {
      const currentNumber = parseInt(latestQuotation.quotationId.split("-")[2]);
      sequenceNumber = String(currentNumber + 1).padStart(3, "0");
    }

    const customQuotationId = `SVSSQ-${year}-${sequenceNumber}`;

    const normalizedProducts = normalizeSectionTitles(products);

    const newQuotation = new Quotation({
      client: client._id,
      sale: sale._id,
      projectName,
      projectLA,
      products: normalizedProducts,
      paymentTerm,
      paymentDelivery,
      note,
      validityPeriod,
      excluding,
      totalPrice,
      currency,
      quotationId: customQuotationId,
      revisionNumber: 0,
    });

    await newQuotation.save();
    return { success: true, quotationId: customQuotationId };
  } catch (err) {
    console.error("Error adding quotation:", err.message);
    return { success: false, error: err.message };
  }
};

export const updateQuotation = async (formData) => {
  const {
    id, projectName, projectLA, products,
    paymentTerm, paymentDelivery, note, excluding,
    totalPrice, currency
  } = formData;

  try {
    await connectToDB();
    const quotation = await Quotation.findById(id);
    if (!quotation) throw new Error("Quotation not found");

    quotation.revisionNumber = (Number(quotation.revisionNumber) || 0) + 1;
    quotation.quotationId = buildRevisionId(
      quotation.quotationId,
      quotation.revisionNumber
    );

    const normalizedProducts = Array.isArray(products)
      ? normalizeSectionTitles(products)
      : undefined;

    const updateFields = {
      projectName,
      projectLA,
      products: normalizedProducts,
      paymentTerm,
      paymentDelivery,     
      note,
      validityPeriod,
      paymentTerm,
      paymentDelivery,
      note,
      totalPrice,
      excluding,
      currency,   // keep if you allow editing currency
      user: null, // force re-approval
    };

    Object.keys(updateFields).forEach((k) => {
      const v = updateFields[k];
      if (v === "" || v === undefined) return;
      quotation[k] = v;
    });

    await quotation.save();
  } catch (err) {
    console.error(err);
    throw new Error("Failed to update quotation!");
  } finally {
    revalidatePath("/dashboard/quotations");
    redirect("/dashboard/quotations");
  }
};


export const editQuotation = async (formData) => {
  const {
    id,
    projectName,
    projectLA,
    products,
    paymentTerm,
    paymentDelivery,
    validityPeriod,
    note,
    excluding,
    totalPrice,
    currency
  } = formData;

  try {
    await connectToDB();
    const quotation = await Quotation.findById(id);
    if (!quotation) {
      throw new Error('Quotation not found');
    }

    quotation.revisionNumber = (Number(quotation.revisionNumber) || 0) + 1;
    quotation.quotationId = buildRevisionId(
      quotation.quotationId,
      quotation.revisionNumber
    );

    // Update basic fields
    quotation.projectName = projectName || quotation.projectName;
    quotation.projectLA = projectLA || quotation.projectLA;
    quotation.paymentTerm = paymentTerm || quotation.paymentTerm;
    quotation.paymentDelivery = paymentDelivery || quotation.paymentDelivery;
    quotation.note = note || quotation.note;
    quotation.excluding = excluding || quotation.excluding;
    quotation.currency = currency || quotation.currency;
    quotation.totalPrice = totalPrice || quotation.totalPrice;
    quotation.user = null; // Require re-approval
    quotation.validityPeriod = validityPeriod || quotation.validityPeriod;
    

    // ✅ Validate and update products
    if (Array.isArray(products) && products.length > 0) {
      quotation.products = products.filter(
        p => p.productCode && p.qty && p.unit
      );
    }

    await quotation.save();

  } catch (err) {
    console.error(err);
    throw new Error("Failed to update quotation!");
  } finally {
    revalidatePath("/dashboard/quotations");
    redirect("/dashboard/quotations");
  }
};

*/


export const addQuotation = async (formData) => {
  const {
    saleId, clientId, projectName, projectLA,
    products, paymentTerm, paymentDelivery, note,
    validityPeriod, excluding, totalPrice, currency,warranty,
    companyProfile,
    // NEW: accept optional discount breakdowns
    totalDiscount,                 // NEW (% on subtotal)
    subtotal,                      // NEW
    subtotalAfterTotalDiscount,    // NEW
    vatAmount                      // NEW
  } = formData;

  try {
    await connectToDB();

    const sale = await Sale.findById(saleId);
    if (!sale) throw new Error("Sale not found");

    const client = await Client.findById(clientId);
    if (!client) throw new Error("Client not found");

    const profile = companyProfile || "SMART_VISION";
    const prefix = profile === "ARABIC_LINE" ? "ALCQ" : "SVSQ";
    const companyFilter =
      profile === "ARABIC_LINE"
        ? { companyProfile: "ARABIC_LINE" }
        : {
            $or: [
              { companyProfile: { $exists: false } },
              { companyProfile: "SMART_VISION" },
            ],
          };

    const year = new Date().getFullYear();
    const latestQuotation = await Quotation.findOne({
      $and: [
        { quotationId: { $regex: `^${prefix}-${year}-` } },
        companyFilter,
      ],
    }).sort({ quotationId: -1 });

    const seqMatch = latestQuotation?.quotationId?.match(
      new RegExp(`^${prefix}-${year}-(\\d{3,})`)
    );
    const sequenceNumber = String(
      seqMatch ? parseInt(seqMatch[1], 10) + 1 : 1
    ).padStart(3, "0");

    const customQuotationId = `${prefix}-${year}-${sequenceNumber}`;

    const normalizedProducts = normalizeSectionTitles(products);

    const newQuotation = new Quotation({
      client: client._id,
      sale: sale._id,
      projectName,
      projectLA,
      products: normalizedProducts,
      paymentTerm,
      paymentDelivery,
      note,
      validityPeriod,
      excluding,
      warranty,
      totalPrice,
      currency,
      companyProfile: profile || undefined,
      quotationId: customQuotationId,
      revisionNumber: 0,

      // NEW: store optional discount breakdown if provided
      totalDiscount: typeof totalDiscount === "number" ? totalDiscount : undefined,              // NEW
      subtotal: typeof subtotal === "number" ? subtotal : undefined,                            // NEW
      subtotalAfterTotalDiscount: typeof subtotalAfterTotalDiscount === "number" ? subtotalAfterTotalDiscount : undefined, // NEW
      vatAmount: typeof vatAmount === "number" ? vatAmount : undefined,                         // NEW
    });

    await newQuotation.save();
    return { success: true, quotationId: customQuotationId };
  } catch (err) {
    console.error("Error adding quotation:", err.message);
    return { success: false, error: err.message };
  }
};

export const updateQuotation = async (formData) => {
  const {
    id, projectName, projectLA, products,
    paymentTerm, paymentDelivery, note, excluding,
    totalPrice, currency,warranty,validityPeriod,
    companyProfile,
    clientId,
    saleId,

    // NEW: allow optional updates
    totalDiscount,                 // NEW
    subtotal,                      // NEW
    subtotalAfterTotalDiscount,    // NEW
    vatAmount                      // NEW
  } = formData;

  try {
    await connectToDB();
    const quotation = await Quotation.findById(id);
    if (!quotation) throw new Error("Quotation not found");

    quotation.revisionNumber = (Number(quotation.revisionNumber) || 0) + 1;
    quotation.quotationId = buildRevisionId(
      quotation.quotationId,
      quotation.revisionNumber
    );

    const normalizedProducts = Array.isArray(products)
      ? normalizeSectionTitles(products)
      : undefined;

    if (clientId) {
      const nextClientId = clientId.toString();
      const currentClientId =
        typeof quotation.client?.toString === "function"
          ? quotation.client.toString()
          : quotation.client;
      if (nextClientId !== currentClientId) {
        const client = await Client.findById(clientId);
        if (!client) throw new Error("Client not found");
        quotation.client = client._id;
      }
    }

    if (saleId) {
      const nextSaleId = saleId.toString();
      const currentSaleId =
        typeof quotation.sale?.toString === "function"
          ? quotation.sale.toString()
          : quotation.sale;
      if (nextSaleId !== currentSaleId) {
        const sale = await Sale.findById(saleId);
        if (!sale) throw new Error("Sale not found");
        quotation.sale = sale._id;
      }
    }

    const updateFields = {
      projectName,
      projectLA,
      products: normalizedProducts,
      paymentTerm,
      paymentDelivery,     
      note,
      validityPeriod,
      paymentTerm,
      paymentDelivery,
      warranty,
      note,
      totalPrice,
      excluding,
      currency,   // keep if you allow editing currency
      companyProfile,
      user: null, // force re-approval

      // NEW: persist if provided
      totalDiscount,                 // NEW
      subtotal,                      // NEW
      subtotalAfterTotalDiscount,    // NEW
      vatAmount                      // NEW
    };

    Object.keys(updateFields).forEach((k) => {
      const v = updateFields[k];
      if (v === "" || v === undefined) return;
      quotation[k] = v;
    });

    await quotation.save();
  } catch (err) {
    console.error(err);
    throw new Error("Failed to update quotation!");
  } finally {
    revalidatePath("/dashboard/quotations");
    redirect("/dashboard/quotations");
  }
};
/*
export const editQuotation = async (formData) => {
  const {
    id,
    projectName,
    projectLA,
    products,
    paymentTerm,
    paymentDelivery, 
    validityPeriod,
    note,
    excluding,
    totalPrice,
    currency,

    // NEW
    totalDiscount,                 // NEW
    subtotal,                      // NEW
    subtotalAfterTotalDiscount,    // NEW
    vatAmount                      // NEW
  } = formData;

  try {
    await connectToDB();
    const quotation = await Quotation.findById(id);
    if (!quotation) {
      throw new Error('Quotation not found');
    }

   


    // Update basic fields safely (allow empty strings)
if (projectName !== undefined) quotation.projectName = projectName;
if (projectLA !== undefined) quotation.projectLA = projectLA;
if (paymentTerm !== undefined) quotation.paymentTerm = paymentTerm;
if (paymentDelivery !== undefined) quotation.paymentDelivery = paymentDelivery;
if (note !== undefined) quotation.note = note;
if (excluding !== undefined) quotation.excluding = excluding;
if (currency !== undefined) quotation.currency = currency;
if (totalPrice !== undefined) quotation.totalPrice = totalPrice;
if (validityPeriod !== undefined) quotation.validityPeriod = validityPeriod;
    quotation.user = null; // Require re-approval



    // NEW: persist breakdown if sent
    if (typeof totalDiscount === "number") quotation.totalDiscount = totalDiscount;                  // NEW
    if (typeof subtotal === "number") quotation.subtotal = subtotal;                                // NEW
    if (typeof subtotalAfterTotalDiscount === "number") quotation.subtotalAfterTotalDiscount = subtotalAfterTotalDiscount; // NEW
    if (typeof vatAmount === "number") quotation.vatAmount = vatAmount;                             // NEW

    // ✅ Validate and update products (keep pattern)
    if (Array.isArray(products) && products.length > 0) {
      quotation.products = products.filter(
        p => p.productCode && p.qty && p.unit
      );
    }

    await quotation.save();

  } catch (err) {
    console.error(err);
    throw new Error("Failed to update quotation!");
  } finally {
    revalidatePath("/dashboard/quotations");
    redirect("/dashboard/quotations");
  }
};
*/



export const editQuotation = async (formData) => {
  const {
    id,
    projectName,
    projectLA,
    products,
    paymentTerm,
    paymentDelivery,
    validityPeriod,
    note,
    warranty,
    excluding,
    totalPrice,
    currency,
    companyProfile,
    clientId,
    saleId,

    // NEW
    totalDiscount,                 
    subtotal,                      
    subtotalAfterTotalDiscount,    
    vatAmount                      
  } = formData;

  try {
    await connectToDB();

    const quotation = await Quotation.findById(id);
    if (!quotation) {
      throw new Error("Quotation not found");
    }

    quotation.quotationId = buildRevisionId(
      quotation.quotationId,
    );

    if (clientId) {
      const nextClientId = clientId.toString();
      const currentClientId =
        typeof quotation.client?.toString === "function"
          ? quotation.client.toString()
          : quotation.client;
      if (nextClientId !== currentClientId) {
        const client = await Client.findById(clientId);
        if (!client) {
          throw new Error("Client not found");
        }
        quotation.client = client._id;
      }
    }

    if (saleId) {
      const nextSaleId = saleId.toString();
      const currentSaleId =
        typeof quotation.sale?.toString === "function"
          ? quotation.sale.toString()
          : quotation.sale;
      if (nextSaleId !== currentSaleId) {
        const sale = await Sale.findById(saleId);
        if (!sale) {
          throw new Error("Sale not found");
        }
        quotation.sale = sale._id;
      }
    }

    // ✅ Safely update basic fields (allow empty strings, 0, etc.)
    if (projectName !== undefined) quotation.projectName = projectName;
    if (projectLA !== undefined) quotation.projectLA = projectLA;
    if (paymentTerm !== undefined) quotation.paymentTerm = paymentTerm;
    if (paymentDelivery !== undefined) quotation.paymentDelivery = paymentDelivery;
    if (note !== undefined) quotation.note = note;
    if (warranty !== undefined) quotation.warranty = warranty;
    if (excluding !== undefined) quotation.excluding = excluding;
    if (currency !== undefined) quotation.currency = currency;
    if (totalPrice !== undefined) quotation.totalPrice = totalPrice;
    if (validityPeriod !== undefined) quotation.validityPeriod = validityPeriod;
    if (companyProfile !== undefined) quotation.companyProfile = companyProfile;

    // Require re-approval after edit
    quotation.user = null;

    // ✅ Persist breakdown values if provided (even if 0)
    if (typeof totalDiscount === "number") quotation.totalDiscount = totalDiscount;
    if (typeof subtotal === "number") quotation.subtotal = subtotal;
    if (typeof subtotalAfterTotalDiscount === "number") quotation.subtotalAfterTotalDiscount = subtotalAfterTotalDiscount;
    if (typeof vatAmount === "number") quotation.vatAmount = vatAmount;

    // ✅ Validate and update products (allow 0 price/unit/qty)
    if (Array.isArray(products)) {
      const normalizedProducts = normalizeSectionTitles(products);
      const filteredProducts = normalizedProducts.filter((p) => {
        if (!p) return false;

        const hasDescription =
          typeof p.description === "string" && p.description.trim() !== "";
        const hasCode =
          typeof p.productCode === "string" && p.productCode.trim() !== "";
        const hasQty = typeof p.qty === "number" && p.qty > 0;
        const hasUnit = typeof p.unit === "number" && p.unit > 0;
        const hasSharedPrice =
          (typeof p.sharedGroupId === "string" &&
            p.sharedGroupId.trim() !== "") ||
          (typeof p.sharedGroupPrice === "number" &&
            !Number.isNaN(p.sharedGroupPrice));
        const hasTitle =
          typeof p.titleAbove === "string" && p.titleAbove.trim() !== "";

        return hasDescription || hasCode || hasQty || hasUnit || hasSharedPrice || hasTitle;
      });

      quotation.products = filteredProducts;
    }

    await quotation.save();

  } catch (err) {
    console.error("Error editing quotation:", err);
    throw new Error("Failed to update quotation!");
  } finally {
    revalidatePath("/dashboard/quotations");
    redirect("/dashboard/quotations");
  }
};


/*
export const updateQuotationApprove = async (formData) => {
  const { id, projectName, projectLA, products, paymentTerm, paymentDelivery, note, excluding, user,totalPrice } = formData;

  try {
    // Connect to the database
    await connectToDB();

    const quotation = await Quotation.findById(id);
    

    const updateFields = {
      projectName,
      projectLA,
      products: normalizedProducts,
      paymentTerm,
      paymentDelivery,
      note,
      totalPrice,
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
*/

export const updateQuotationApprove = async (formData) => {
  const {
    id,
    projectName,
    projectLA,
    products,
    paymentTerm,
    paymentDelivery,
    note,
    excluding,
    user,
    totalPrice,
  } = formData;

  try {
    await connectToDB();

    const quotation = await Quotation.findById(id);
    if (!quotation) throw new Error("Quotation not found");

    // If you want section-title normalization here too, keep this:
    const normalizedProducts = Array.isArray(products)
      ? normalizeSectionTitles(products)
      : undefined;

    const updateFields = {
      projectName,
      projectLA,
      products: normalizedProducts,      // <-- now defined (or undefined if not sent)
      paymentTerm,
      paymentDelivery,
      note,
      totalPrice,
      excluding,
      ...(user ? { user } : {}),         // set admin if provided
    };

    // Strip empties/undefined to avoid overwriting with blanks
    Object.keys(updateFields).forEach((k) => {
      if (updateFields[k] === "" || updateFields[k] === undefined) {
        delete updateFields[k];
      }
    });

    Object.assign(quotation, updateFields);
    await quotation.save();
  } catch (err) {
    console.error("updateQuotationApprove error:", err);
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

    let quotation = null;
    if (quotationId) {
      quotation = await Quotation.findById(quotationId);
      if (!quotation) {
        throw new Error('Quotation not found');
      }
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
      quotation: quotation ? quotation._id : null,
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
  const { saleId, clientId, jobOrderId, products, deliveryLocation } = formData;

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

  

    const year = new Date().getFullYear();

    const latestPicklist = await Pl.findOne({
      pickListId: { $regex: `SVSPL-${year}-` },
    }).sort({ pickListId: -1 });

    let sequenceNumber = '001';
    if (latestPicklist) {
      const currentNumber = parseInt(latestPicklist.pickListId.split('-')[2]);
      sequenceNumber = String(currentNumber + 1).padStart(3, '0');
    }

    const customPickListIdId = `SVSPL-${year}-${sequenceNumber}`;

    const newPickList = new Pl({
      client: client._id,
      sale: sale._id,
      jobOrder: jobOrder._id,
      products,
      deliveryLocation,
      pickListId: customPickListIdId,
      revisionNumber: 0,
    });

    await newPickList.save();
    console.log('pl added successfully:', newPickList);

    revalidatePath("/dashboard/pl_coc/pl");
    return { success: true, pickListId: customPickListIdId };
  } catch (err) {
    console.error("Error adding pl:", err.message);
    throw new Error('Failed to add pl!');
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

export const getAllTasksDetailed = async () => {
  await connectToDB();

  const session = await auth();
  if (!session || !session.user?.id) {
    throw new Error("Not authenticated");
  }

  const tasks = await Task.find({})
    .populate('createdBy', 'username email')
    .populate('assignedTo', 'username email')
    .select('title description status deadline comment createdBy assignedTo createdAt updatedAt')
    .sort({ createdAt: -1 })
    .lean();

  const mapUser = (user, fallback) => {
    if (!user) return null;
    const id = user._id
      ? user._id.toString()
      : typeof user === 'string'
        ? user
        : '';

    return {
      id,
      name: user.username || user.email || fallback,
      email: user.email || '',
    };
  };

  return {
    currentUserId: session.user.id,
    tasks: tasks.map(task => ({
      id: task._id.toString(),
      title: task.title,
      description: task.description || '',
      comment: task.comment || '',
      status: task.status,
      deadline: task.deadline?.toISOString().split('T')[0] || '—',
      deadlineRaw: task.deadline?.toISOString() || null,
      createdAt: task.createdAt?.toISOString() || null,
      updatedAt: task.updatedAt?.toISOString() || null,
      createdBy: mapUser(task.createdBy, 'Unknown'),
      assignedTo: mapUser(task.assignedTo, 'Unassigned'),
    })),
  };
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


export const getAllTicketsDetailed = async () => {
  await connectToDB();

  const session = await auth();
  if (!session || !session.user?.id) {
    throw new Error("Not authenticated");
  }

  const userId = session.user.id;

  const tickets = await Ticket.find({
    $or: [{ assignedTo: userId }, { createdBy: userId }],
  })
    .populate('createdBy', 'username email')
    .populate('assignedTo', 'username email')
    .select('title description status deadline createdBy assignedTo createdAt updatedAt')
    .sort({ createdAt: -1 })
    .lean();

  const mapUser = (user, fallback) => {
    if (!user) return null;
    const id = user._id
      ? user._id.toString()
      : typeof user === 'string'
        ? user
        : '';

    return {
      id,
      name: user.username || user.email || fallback,
      email: user.email || '',
    };
  };

  return {
    currentUserId: userId,
    tickets: tickets.map(ticket => ({
      id: ticket._id.toString(),
      title: ticket.title,
      description: ticket.description || '',
      status: ticket.status,
      deadline: ticket.deadline?.toISOString().split('T')[0] || '—',
      deadlineRaw: ticket.deadline?.toISOString() || null,
      createdAt: ticket.createdAt?.toISOString() || null,
      updatedAt: ticket.updatedAt?.toISOString() || null,
      createdBy: mapUser(ticket.createdBy, 'Unknown'),
      assignedTo: mapUser(ticket.assignedTo, 'Unassigned'),
    })),
  };
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



export const markTicketAsInProgress = async (id) => {
  await connectToDB();

  const ticket = await Ticket.findById(id);
  if (!ticket) throw new Error("Ticket not found");

  ticket.status = 'in-progress';
  await ticket.save();

  return {
    id: ticket._id.toString(),
    title: ticket.title,
    description: ticket.description,
    status: ticket.status,
    deadline: ticket.deadline?.toISOString().split('T')[0] || '—',
  };
};




export const markTaskAsInProgress = async (id) => {
  await connectToDB();

  const task = await Task.findById(id);
  if (!task) throw new Error("Task not found");

  task.status = 'in-progress';
  await task.save();

  return {
    id: task._id.toString(),
    title: task.title,
    description: task.description,
    status: task.status,
    deadline: task.deadline?.toISOString().split('T')[0] || '—',
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
    currency,
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
    currency,
    totalPrice,
  } = formData;

  try {
    await connectToDB();

    const purchaseOrder = await PurchaseOrder.findById(id);
    if (!purchaseOrder) {
      throw new Error('PurchaseOrder not found');
    }

    // ✅ Safely update basic fields only if provided
    if (typeof supplierName === 'string') purchaseOrder.supplierName = supplierName;
    if (typeof paymentTerm === 'string') purchaseOrder.paymentTerm = paymentTerm;
    if (typeof deliveryLocation === 'string') purchaseOrder.deliveryLocation = deliveryLocation;
    if (typeof sellingPolicy === 'string') purchaseOrder.sellingPolicy = sellingPolicy;
    if (typeof deliveryTerm === 'string') purchaseOrder.deliveryTerm = deliveryTerm;
    if (typeof validityPeriod === 'string') purchaseOrder.validityPeriod = validityPeriod;
    if (typeof delayPenalties === 'string') purchaseOrder.delayPenalties = delayPenalties;
    if (typeof currency === 'string') purchaseOrder.currency = currency;
    if (typeof totalPrice === 'number') purchaseOrder.totalPrice = totalPrice;

    // ✅ Re-approval logic
    purchaseOrder.user = null;

    // ✅ Safely update products
    if (Array.isArray(products) && products.length > 0) {
      const validProducts = products.filter(
        (p) => p.productCode && p.qty && p.unit
      );

      purchaseOrder.products = validProducts;
    }

    // ✅ Log before saving
    console.log("Saving updated Purchase Order:", purchaseOrder);

    await purchaseOrder.save();

    console.log("✅ Purchase Order updated successfully");

  } catch (err) {
    console.error("❌ Error in editPurchaseOrder:", err);
    throw new Error("Failed to update purchase!");
  } finally {
    revalidatePath('/dashboard/purchaseOrder');
    redirect('/dashboard/purchaseOrder');
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
