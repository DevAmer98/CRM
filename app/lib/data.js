import { ObjectId } from 'mongodb'; // Import ObjectId for validation
import { User, Client, Supplier, Quotation, PurchaseOrder, JobOrder, Sale, Coc, Pl, Approve, ApprovePo, Employee, Leave, Shift, Department, Lead } from "@/app/lib/models";
import { connectToDB } from './utils';
import { ROLES } from './role';

const sanitizeBson = (value) => {
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    return value.map(sanitizeBson);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'object') {
    if (value._bsontype === 'ObjectID' || value._bsontype === 'ObjectId') {
      return value.toString();
    }

    return Object.entries(value).reduce((acc, [key, val]) => {
      acc[key] = sanitizeBson(val);
      return acc;
    }, {});
  }

  return value;
};

export const fetchUsers = async (q, page) => {

    const regex = new RegExp(q, "i");
    const ITEM_PER_PAGE = 10;
    try {
         await connectToDB()
         const count = await User.countDocuments({ username: { $regex: regex } });
         const users = await User.find({ username: { $regex: regex } }).limit(ITEM_PER_PAGE).skip(ITEM_PER_PAGE * (page - 1));
        return { count, users };
    } catch (err) {
        console.log(err);
        throw new Error('Failed to fetch Users!')
    }
  
  };
  
  
  export const fetchUser = async (id) => {
    try {
      // Validate the ID
      if (!ObjectId.isValid(id)) {
        throw new Error(`Invalid user ID: ${id}`);
      }
  
      await connectToDB();
  
      // Fetch the user
      const user = await User.findById(id);
  
      // Check if the user exists
      if (!user) {
        throw new Error(`User with ID ${id} not found`);
      }
  
      return user;
    } catch (err) {
      console.error('Error in fetchUser:', err);
      throw new Error('Failed to fetch User!');
    }
  };

  /*export const fetchAllUsers = async () => {
    try {
      await connectToDB();
      const users = await User.find({});
      return users;
    } catch (err) {
      console.log("Error in fetchAllUsers:", err);
      throw new Error('Failed to fetch users!');
    }
};
*/

export const fetchAllUsers = async () => {
  try {
    await connectToDB();
    const users = await User.find({})
      .populate("employee");  // <-- ADD THIS

    return users;
  } catch (err) {
    console.log("Error in fetchAllUsers:", err);
    throw new Error("Failed to fetch users!");
  }
};


  
  
  export const fetchClients = async (q, page) => {
    const regex = new RegExp(q, "i");
    const ITEM_PER_PAGE = 10;
    try {
      await connectToDB()
      const count = await Client.countDocuments({ name: { $regex: regex } });
        const clients = await Client.find({ name: { $regex: regex } }).limit(ITEM_PER_PAGE).skip(ITEM_PER_PAGE * (page - 1));
        return { count, clients };
    } catch (err) {
        console.log(err);
        throw new Error('Failed to fetch Clients!')
    }
  };

  
  export const fetchEmployees = async (q, page) => {
    const regex = new RegExp(q, "i");
    const ITEM_PER_PAGE = 10;
    try {
      await connectToDB()
      const count = await Employee.countDocuments({ name: { $regex: regex } });
        const employees = await Employee.find({ name: { $regex: regex } }).limit(ITEM_PER_PAGE).skip(ITEM_PER_PAGE * (page - 1));
        return { count, employees };
    } catch (err) {
        console.log(err);
        throw new Error('Failed to fetch Employees!')
    }
  };


  
  /*
  export const fetchDepartments = async (q, page) => {
    const regex = new RegExp(q, "i");
    const ITEM_PER_PAGE = 10;
    try {
      await connectToDB()
      const count = await Department.countDocuments({ name: { $regex: regex } });
        const departments = await Department.find({ name: { $regex: regex } }).limit(ITEM_PER_PAGE).skip(ITEM_PER_PAGE * (page - 1));
        return { count, departments };
    } catch (err) {
        console.log(err);
        throw new Error('Failed to fetch Employees!')
    }
  };
*/


export const fetchDepartments = async (q, page) => {
  const regex = new RegExp(q, 'i');
  const ITEM_PER_PAGE = 10;

  try {
    await connectToDB();

    const filter = { name: { $regex: regex } };
    const count = await Department.countDocuments(filter);

    const rows = await Department.find(filter)
      .select('name createdAt directManager employees')
      .populate({ path: 'directManager', select: 'name employeeNo' })
      .sort({ createdAt: -1 })
      .limit(ITEM_PER_PAGE)
      .skip(ITEM_PER_PAGE * (page - 1))
      .lean();

    const departments = rows.map((d) => {
      const managerId = d.directManager?._id?.toString?.();
      const employeeCount = Array.isArray(d.employees)
        ? d.employees.filter((eid) => eid?.toString?.() !== managerId).length
        : 0;

      return {
        _id: d._id,
        name: d.name,
        createdAt: d.createdAt,
        directManager: d.directManager, // populated doc (name, employeeNo)
        employeeCount, // ✅ excludes the manager
      };
    });

    return { count, departments };
  } catch (err) {
    console.error(err);
    throw new Error('Failed to fetch departments!');
  }
};



export const fetchLeaves = async (q, page) => {
  const regex = new RegExp(q, "i");
  const ITEMS_PER_PAGE = 10;

  try {
    await connectToDB();

    const pipeline = [
      {
        $lookup: {
          from: "employees",
          localField: "employee",
          foreignField: "_id",
          as: "employee"
        }
      },
      {
        $unwind: "$employee"
      },
      {
        $match: {
          $or: [
            { "employee.name": { $regex: regex } },
            { leaveType: { $regex: regex } },
            { addressWhileOnVacation: { $regex: regex } }
          ]
        }
      },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: ITEMS_PER_PAGE * (page - 1) },
            { $limit: ITEMS_PER_PAGE }
          ]
        }
      }
    ];

    const result = await Leave.aggregate(pipeline);

    const count = result[0]?.metadata[0]?.total || 0;
    const rawLeaves = result[0]?.data || [];

    // Re-populate user fields on the already filtered result
    const leaves = await Leave.populate(rawLeaves, [
      { path: "approvals.admin.approvedBy", select: "username" },
      { path: "approvals.hrAdmin.approvedBy", select: "username" },
      { path: "approvals.admin.rejectedBy", select: "username" },
      { path: "approvals.hrAdmin.rejectedBy", select: "username" },
    ]);

    return { count, leaves };
  } catch (err) {
    console.error("Error in fetchLeaves:", err);
    throw new Error("Failed to fetch Leaves!");
  }
};


// lib/data.js or a new file
export const getPendingLeavesCount = async () => {
  try {
    await connectToDB();
    const count = await Leave.countDocuments({
      $or: [
        { "approvals.admin.approved": false, "approvals.admin.rejected": false },
        { "approvals.hrAdmin.approved": false, "approvals.hrAdmin.rejected": false }
      ]
    });
    return count;
  } catch (err) {
    console.error("Error getting pending leaves count", err);
    return 0;
  }
};




  export const fetchSales = async (q, page) => {
    const regex = new RegExp(q, "i");
    const ITEM_PER_PAGE = 10;
    try {
      await connectToDB()
      const count = await Sale.countDocuments({ name: { $regex: regex } });
        const sales = await Sale.find({ name: { $regex: regex } }).limit(ITEM_PER_PAGE).skip(ITEM_PER_PAGE * (page - 1));
        return { count, sales };
    } catch (err) {
        console.log(err);
        throw new Error('Failed to fetch Sales!')
    }
  };

 


  export const fetchAllClients = async () => {
    try {
      await connectToDB();
      const clients = await Client.find({});
      return clients;
    } catch (err) {
      console.log("Error in fetchAllClients:", err);
      throw new Error('Failed to fetch Clients!');
    }
};



/*
  export const fetchAllDepartments = async () => {
    try {
      await connectToDB();
      const departments = await Department.find({});
      return departments;
    } catch (err) {
      console.log("Error in fetchAllDepartments", err);
      throw new Error('Failed to fetch Departments!');
    }
};

*/

export const fetchAllDepartments = async () => {
  try {
    await connectToDB();

    const departments = await Department.find({})
      .select('name directManager employees createdAt') // keep payload tight
      .populate({ path: 'directManager', select: 'name employeeNo' }) // <-- needed for UI
      .lean();

    // (Optional) if you prefer to include a computed count and drop the raw employees array:
    // return departments.map(d => ({
    //   _id: d._id,
    //   name: d.name,
    //   createdAt: d.createdAt,
    //   directManager: d.directManager, // { _id, name, employeeNo } due to populate
    //   employeeCount: Array.isArray(d.employees) ? d.employees.length : 0,
    // }));

    return departments;
  } catch (err) {
    console.log('Error in fetchAllDepartments', err);
    throw new Error('Failed to fetch Departments!');
  }
};



export const fetchAllManagers = async () => {
  try {
    await connectToDB();
    const managers = await User.find({ role: 'admin' });  
    return managers;
  } catch (err) {
    console.log("Error in fetchAllAdmins:", err);
    throw new Error('Failed to fetch Admins!');
  }
};

export const fetchAllProcurementUsers = async () => {
  try {
    await connectToDB();
    const userPro = await User.find({ role: ROLES.USER_PROCUREMENT });
    return userPro;
  } catch (err) {
    console.log("Error in fetchAllProcurementUsers:", err);
    throw new Error('Failed to fetch Procurement Users!');
  }
};

export const fetchAllSales = async () => {
  try {
    await connectToDB();
    const sales = await Sale.find({});
    return sales;
  } catch (err) {
    console.log("Error in fetchAllSales:", err);
    throw new Error('Failed to fetch Sales!');
  }
};


export const fetchAllSupliers = async () => {
  try {
    await connectToDB();
    const suppliers = await Supplier.find({});
    return suppliers;
  } catch (err) {
    console.log("Error in fetchAllSuppliers:", err);
    throw new Error('Failed to fetch Suppliers!');
  }
};


  
  
  export const fetchClient = async (id) => {
    try {
      await  connectToDB()
        const client = await Client.findById(id)
        return client
    } catch (err) {
        console.log(err);
        throw new Error('Failed to fetch Client!')
    }
  
  };

   /*
 export const fetchDepartment = async (id) => {
  try {
    await connectToDB();

    const department = await Department.findById(id)
      .populate({ path: 'directManager', select: 'name employeeNo jobTitle contactMobile email' })
      .populate({ path: 'employees', select: 'name employeeNo jobTitle' })
      .lean();

    return department;
  } catch (err) {
    console.log(err);
    throw new Error('Failed to fetch department!');
  }
};
*/


export const fetchDepartment = async (id) => {
  try {
    await connectToDB();

    const d = await Department.findById(id)
      .populate({ path: 'directManager', select: 'name employeeNo jobTitle contactMobile email' })
      .populate({ path: 'employees', select: 'name employeeNo jobTitle' })
      .lean();

    if (!d) return null;

    const managerId = d.directManager?._id?.toString?.();
    const employees = Array.isArray(d.employees)
      ? d.employees.filter((e) => e?._id?.toString?.() !== managerId)
      : [];

    // return the same shape the page expects, but with employees cleaned
    return {
      ...d,
      employees,
      employeeCount: employees.length, // optional convenience
    };
  } catch (err) {
    console.log(err);
    throw new Error('Failed to fetch department!');
  }
};

  
  

  export const fetchEmployee = async (id) => {
    try {
      // Validate the ID
      if (!ObjectId.isValid(id)) {
        throw new Error(`Invalid Employee ID: ${id}`);
      }
  
      await connectToDB();
  
      // Fetch the user
      const employee = await Employee.findById(id);
  
      // Check if the user exists
      if (!employee) {
        throw new Error(`Employee with ID ${id} not found`);
      }
  
      return employee;
    } catch (err) {
      console.error('Error in fetch Employee:', err);
      throw new Error('Failed to fetch Employee!');
    }
  };



  

export const fetchShift = async (id) => {
  try {

     if (!ObjectId.isValid(id)) {
        throw new Error(`Invalid Employee ID: ${id}`);
      }

    await connectToDB();

    // lean => plain JS object (no Mongoose doc methods/prototypes)
    const doc = await Shift.findById(id)
      .populate({ path: 'employee', select: 'name employeeNo contactMobile' })
      .lean();

    if (!doc) return null;

    const toStr = (v) => (v == null ? null : String(v));
    const toISO = (d) =>
      typeof d === 'string' ? d : (d?.toISOString?.() ?? null);

    // normalize everything to serializable primitives
    return {
      _id: toStr(doc._id),
      employee: doc.employee
        ? {
            _id: toStr(doc.employee._id),
            name: doc.employee.name ?? '',
            employeeNo: doc.employee.employeeNo ?? '',
            contactMobile: doc.employee.contactMobile ?? '',
          }
        : null,
      date: toISO(doc.date)?.slice(0, 10) || '', // YYYY-MM-DD for <input type="date">
      startTime: doc.startTime ?? '',
      endTime: doc.endTime ?? '',
      location: doc.location ?? '',
      createdAt: toISO(doc.createdAt),
      updatedAt: toISO(doc.updatedAt),
    };
  } catch (err) {
    console.error('Error in fetchShift:', err);
    throw new Error('Failed to fetch Shift!');
  }
};


export const fetchShifts = async (q = "", page = 1, limit = 10) => {
  try {
    await connectToDB();

    const query = q
      ? {
          $or: [
            { 'employee.name': { $regex: q, $options: 'i' } },
            { 'employee.employeeNo': { $regex: q, $options: 'i' } },
          ],
        }
      : {};

    const total = await Shift.countDocuments(query);

    const shifts = await Shift.find(query)
      .populate('employee', 'name employeeNo contactMobile email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return { count: total, shifts };
  } catch (err) {
    console.error('Error in fetchShifts:', err);
    throw new Error('Failed to fetch shifts!');
  }
};





export const fetchLeave = async (id) => {
  try {
    if (!ObjectId.isValid(id)) throw new Error(`Invalid Leave ID: ${id}`);
    await connectToDB();

    const leave = await Leave.findById(id)
    .populate('employee', 'name leaveBalance contractStartDate')
      .populate('approvals.admin.approvedBy', 'username')
      .populate('approvals.hrAdmin.approvedBy', 'username')
      .populate('approvals.admin.rejectedBy', 'username')    // ✅ add rejectedBy for admin
      .populate('approvals.hrAdmin.rejectedBy', 'username'); // ✅ add rejectedBy for HR

    console.log('FETCHED LEAVE:', leave);

    if (!leave) throw new Error(`Leave with ID ${id} not found`);
    return leave;
  } catch (err) {
    console.error('Error in fetchLeave:', err);
    throw new Error('Failed to fetch Leave!');
  }
};


  export const fetchSale = async (id) => {
    try {
      await  connectToDB()
        const sale = await Sale.findById(id)
        return sale
    } catch (err) {
        console.log(err);
        throw new Error('Failed to fetch Sale!')
    }
  
  };

  export const fetchAllQuotations = async (quotationId, companyProfile) => {
    const filters = [];

    if (quotationId) {
      filters.push({ quotationId: { $regex: new RegExp(quotationId, "i") } });
    }

    if (companyProfile && ["SMART_VISION", "ARABIC_LINE"].includes(companyProfile)) {
      if (companyProfile === "SMART_VISION") {
        filters.push({
          $or: [
            { companyProfile: { $exists: false } },
            { companyProfile: "SMART_VISION" },
          ],
        });
      } else {
        filters.push({ companyProfile });
      }
    }

    const query = filters.length ? { $and: filters } : {};

    try {
      await connectToDB();
      const quotations = await Quotation.find(query)
        .populate('sale')
        .populate('client')
        .populate({ path: 'user', select: 'username' })
        .sort({ createdAt: -1 })
        .lean();

      return quotations;
    } catch (err) {
      console.log("Error in fetchAllQuotations:", err);
      throw new Error('Failed to fetch Quotations!');
    }
  };


  export const fetchQuotationApprovalStats = async () => {
  try {
    await connectToDB();

    const approvedCount = await Quotation.countDocuments({ user: { $exists: true, $ne: null } });
    const notApprovedCount = await Quotation.countDocuments({ $or: [{ user: { $exists: false } }, { user: null }] });

    return {
      approved: approvedCount,
      notApproved: notApprovedCount
    };
  } catch (err) {
    console.error("Error in fetchQuotationApprovalStats:", err);
    throw new Error('Failed to fetch quotation approval stats!');
  }
};



  export const fetchPurchaseApprovalStats = async () => {
  try {
    await connectToDB();

    const approvedCount = await PurchaseOrder.countDocuments({ user: { $exists: true, $ne: null } });
    const notApprovedCount = await PurchaseOrder.countDocuments({ $or: [{ user: { $exists: false } }, { user: null }] });

    return {
      approved: approvedCount,
      notApproved: notApprovedCount
    };
  } catch (err) {
    console.error("Error in fetchPurchaseApprovalStats:", err);
    throw new Error('Failed to fetch purchase order approval stats!');
  }
};


  export const fetchAllPurchase = async () => {
    try {
      await connectToDB();
      const purchaseOrders = await PurchaseOrder.find({});
      return purchaseOrders;
    } catch (err) {
      console.log("Error in fetchAllPurchase:", err);
      throw new Error('Failed to fetch fetchAllPurchase!');
    }
  };
export const fetchAllJobs = async () => {
  try {
    await connectToDB();
    const jobOrders = await JobOrder.find({}).populate('quotation','products');
    return jobOrders;
  } catch (err) {
    console.log("Error in jobOrders:", err);
    throw new Error('Failed to fetch jobOrders!');
  }
};

  
  /*
  export const fetchQuotations = async (projectName, page = 1) => {
    const ITEM_PER_PAGE = 10;
    let query = {};

    if (projectName) {
        query.projectName = { $regex: new RegExp(projectName, "i") };
    }
  
    try {
        await connectToDB();
        const count = await Quotation.countDocuments(query);
        const quotations = await Quotation.find(query)
            .populate('sale')
            .populate('client') 
            .populate({
              path: 'user',
              select: 'username'
            })
            .limit(ITEM_PER_PAGE)
            .skip((page - 1) * ITEM_PER_PAGE);


        return { count, quotations };
    } catch (err) {
        console.error('Error fetching quotations:', err);
        throw new Error('Failed to fetch quotations');
    }
};
*/


export const fetchQuotations = async (quotationId, page = 1, companyProfile) => {
  const ITEM_PER_PAGE = 10;
  const filters = [];

  if (quotationId) {
    filters.push({ quotationId: { $regex: new RegExp(quotationId, "i") } });
  }
  if (companyProfile && ["SMART_VISION", "ARABIC_LINE"].includes(companyProfile)) {
    if (companyProfile === "SMART_VISION") {
      filters.push({
        $or: [
          { companyProfile: { $exists: false } },
          { companyProfile: "SMART_VISION" },
        ],
      });
    } else {
      filters.push({ companyProfile });
    }
  }
  const query = filters.length ? { $and: filters } : {};

  try {
    await connectToDB();
    const count = await Quotation.countDocuments(query);
    const quotations = await Quotation.find(query)
      .populate('sale')
      .populate('client')
      .populate({ path: 'user', select: 'username' })
      .limit(ITEM_PER_PAGE)
      .skip((page - 1) * ITEM_PER_PAGE);

    const quotationsPlain = quotations.map((q) => sanitizeBson(q.toObject()));

    return { count, quotations: quotationsPlain };
  } catch (err) {
    console.error('Error fetching quotations:', err);
    throw new Error('Failed to fetch quotations');
  }
};

export const fetchLeads = async (query = '', page = 1) => {
  const ITEM_PER_PAGE = 10;
  const currentPage = Number(page) || 1;
  const regex = query ? new RegExp(query, 'i') : null;

  const filter = regex ? { name: { $regex: regex } } : {};

  try {
    await connectToDB();
    const count = await Lead.countDocuments(filter);
    const leads = await Lead.find(filter)
      .populate({ path: 'agent', select: 'name email' })
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * ITEM_PER_PAGE)
      .limit(ITEM_PER_PAGE)
      .lean();

    return { count, leads };
  } catch (err) {
    console.error('Error fetching leads:', err);
    throw new Error('Failed to fetch leads');
  }
};

export const fetchQuotation = async (id) => {
  try {
    await connectToDB();
    const quotation = await Quotation.findById(id)
      .populate('client')
      .populate('sale')
      .populate({
        path: 'user',
        select: 'username employee',
        populate: {
          path: 'employee',
          select: 'name',
        },
      });
    return quotation;
  } catch (err) {
    console.error(err);
    throw new Error('Failed to fetch Quotation!');
  }
};


export const fetchJobOrders = async (q, page) => {
  const hasQuery = typeof q === 'string' && q.trim() !== '';
  const regex = hasQuery ? new RegExp(q, "i") : null;
  const ITEM_PER_PAGE = 10;

  try {
    await connectToDB();

    const baseQuery = regex ? { poNumber: { $regex: regex } } : {};

    const count = await JobOrder.countDocuments(baseQuery);

    const jobOrders = await JobOrder.find(baseQuery)
      .populate({
        path: 'quotation',
        select: 'quotationId projectName totalPrice paymentTerm paymentDelivery sale products currency subtotal subtotalAfterTotalDiscount totalDiscount vatAmount',
        populate: {
      path: 'sale',
      select: 'name', 
    }
      })
      .populate({
        path: 'client',
        select: 'name', // only what you need
      })
      .limit(ITEM_PER_PAGE)
      .skip((page - 1) * ITEM_PER_PAGE)
      .lean(); // ✅ prevent circular references

    return { count, jobOrders };
  } catch (err) {
    console.log(err);
    throw new Error('Failed to fetch jobs!');
  }
};

export const fetchJobOrderById = async (id) => {
  try {
    await connectToDB();
    const jobOrder = await JobOrder.findById(id)
      .populate({
        path: 'quotation',
        select:
          'quotationId projectName totalPrice paymentTerm paymentDelivery sale products currency subtotal subtotalAfterTotalDiscount totalDiscount vatAmount',
        populate: {
          path: 'sale',
          select: 'name',
        },
      })
      .populate({
        path: 'client',
        select: 'name',
      })
      .lean();
    return jobOrder;
  } catch (err) {
    console.error('Error fetching job order by id:', err);
    throw new Error('Failed to fetch job order');
  }
};



export const fetchCocs = async (projectName, page = 1) => {
  const ITEM_PER_PAGE = 10;
  let query = {};

  if (projectName) {
      query.projectName = { $regex: new RegExp(projectName, "i") };
  }

  try {
      await connectToDB();
      const count = await Coc.countDocuments(query);
      const cocs = await Coc.find(query)
          .populate('jobOrder')
          .populate('sale')
          .populate('client')
          .populate('quotation')
          .populate({
            path: 'user',
            select: 'username'
          })    
          .limit(ITEM_PER_PAGE)
          .skip((page - 1) * ITEM_PER_PAGE);


      return { count, cocs }; // Return 'cocs' instead of 'Cocs'
  } catch (err) {
      console.error('Error fetching Cocs:', err);
      throw new Error('Failed to fetch cocs');
  }
};


export const fetchCoc = async (id) => {
  try {
    await connectToDB();
    const coc = await Coc.findById(id).populate('jobOrder')
    .populate('sale')
    .populate('client') 
    .populate('quotation')
    .populate({
      path: 'user',
      select: 'username'
    })    
    return coc;
  } catch (err) {
    console.error('Error fetching coc:', err);
    throw new Error(`Failed to fetch coc: ${err.message}`);
  }
};


export const fetchPls = async (projectName, page = 1) => {
  const ITEM_PER_PAGE = 10;
  let query = {};

  if (projectName) {
      query.projectName = { $regex: new RegExp(projectName, "i") };
  }

  try {
      await connectToDB();
      const count = await Pl.countDocuments(query);
      const pls = await Pl.find(query)
          .populate('jobOrder')
          .populate('sale')
          .populate('client')
          .populate('quotation')  
          .limit(ITEM_PER_PAGE)
          .skip((page - 1) * ITEM_PER_PAGE);


      return { count, pls }; 
  } catch (err) {
      console.error('Error fetching Pls:', err);
      throw new Error('Failed to fetch pls');
  }
};


export const fetchPl = async (id) => {
  try {
    await connectToDB();
    const pl = await Pl.findById(id).populate('sale').populate('client').populate('jobOrder').populate('quotation')  
    return pl;
  } catch (err) {
    console.error('Error fetching pl:', err);
    throw new Error(`Failed to fetch pl: ${err.message}`);
  }
};



export const fetchPurchaseOrdersForSupplier = async (supplierId) => {
  try {
    const purchaseOrders = await PurchaseOrder.find({ supplier: supplierId })
      .populate('supplier')
      .populate({
        path: 'jobOrder',
        populate: [
          { path: 'client' },
          { path: 'quotation' }
        ]
      })
      .populate('userPro')
      .lean();

    const safePurchaseOrders = purchaseOrders.map(po => ({
      ...po,
      _id: po._id.toString(),
      supplier: po.supplier
        ? { ...po.supplier, _id: po.supplier._id.toString() }
        : null,
      jobOrder: po.jobOrder
        ? {
            ...po.jobOrder,
            _id: po.jobOrder._id.toString(),
            client: po.jobOrder.client
              ? { ...po.jobOrder.client, _id: po.jobOrder.client._id.toString() }
              : null,
            quotation: po.jobOrder.quotation
              ? { ...po.jobOrder.quotation, _id: po.jobOrder.quotation._id.toString() }
              : null,
          }
        : null,
      userPro: po.userPro
        ? { ...po.userPro, _id: po.userPro._id.toString() }
        : null,
    }));

    return safePurchaseOrders;
  } catch (error) {
    console.error(`Error fetching purchase orders for supplier ${supplierId}:`, error);
    throw new Error('Failed to fetch purchase orders');
  }
};

export const fetchSuppliersWithPurchaseOrders = async (q = "", page = 1, pageSize = 10) => {
  try {
    await connectToDB();

    const filter = q
      ? { name: { $regex: q, $options: "i" } }
      : {};

    const skip = (page - 1) * pageSize;

    const [suppliers, count] = await Promise.all([
      Supplier.find(filter)
        .skip(skip)
        .limit(pageSize)
        .lean()
        .then(async (suppliers) =>
          Promise.all(
            suppliers.map(async (supplier) => {
              const purchaseOrders = await PurchaseOrder.find({ supplier: supplier._id })
                .populate({
                  path: 'jobOrder',
                  populate: [
                    { path: 'client' },
                    {
                      path: 'quotation',
                      populate: [
                        { path: 'sale' },
                        { path: 'client' },
                      ]
                    },
                  ],
                })
                .populate('userPro')
                .lean();

              const safePurchaseOrders = purchaseOrders.map(po => ({
                ...po,
                _id: po._id.toString(),
               remainingAmount:
  po.remainingAmount !== undefined && po.remainingAmount !== null
    ? po.remainingAmount  
    : po.totalPrice,

                supplier: po.supplier?.toString?.() ?? po.supplier,
                jobOrder: po.jobOrder
                  ? {
                      ...po.jobOrder,
                      _id: po.jobOrder._id.toString(),
                      client: po.jobOrder.client
                        ? { ...po.jobOrder.client, _id: po.jobOrder.client._id.toString() }
                        : null,
                      quotation: po.jobOrder.quotation
                        ? {
                            ...po.jobOrder.quotation,
                            _id: po.jobOrder.quotation._id.toString(),
                            sale: po.jobOrder.quotation.sale
                              ? { ...po.jobOrder.quotation.sale, _id: po.jobOrder.quotation.sale._id.toString() }
                              : null,
                            client: po.jobOrder.quotation.client
                              ? { ...po.jobOrder.quotation.client, _id: po.jobOrder.quotation.client._id.toString() }
                              : null,
                            products: po.jobOrder.quotation.products?.map(prod => ({
                              ...prod,
                              _id: prod._id.toString(),
                            })) ?? [],
                          }
                        : null,
                    }
                  : null,
                userPro: po.userPro
                  ? { ...po.userPro, _id: po.userPro._id.toString() }
                  : null,
                products: Array.isArray(po.products)
                  ? po.products.map(prod => ({
                      ...prod,
                      _id: prod._id.toString(),
                    }))
                  : [],
              }));

              return {
                ...supplier,
                _id: supplier._id.toString(),
                purchaseOrders: safePurchaseOrders,
              };
            })
          )
        ),
      Supplier.countDocuments(filter),
    ]);

    return { suppliers, count };
  } catch (error) {
    console.error('Error fetching suppliers with purchaseOrders:', error);
    throw new Error('Failed to fetch suppliers with purchaseOrders');
  }
};


/*
export async function fetchClientsWithQuotations(q = '', page = 1) {
  await connectToDB();

  const pageSize = 10;
  const skip = (page - 1) * pageSize;

  const matchStage = q
    ? {
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { phone: { $regex: q, $options: 'i' } },
        ],
      }
    : {};

  const clients = await Client.aggregate([
    { $match: matchStage },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: pageSize },
    {
      $lookup: {
        from: 'quotations', // must match the **actual MongoDB collection name**
        localField: '_id',
        foreignField: 'client',
        as: 'quotations',
      },
    },
  ]);

  const count = await Client.countDocuments(matchStage);

  return { clients, count };
}

*/


export async function fetchClientsWithQuotations(q = '', page = 1) {
  await connectToDB();

  const pageSize = 10;
  const skip = (page - 1) * pageSize;

  const matchStage = q
    ? {
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { phone: { $regex: q, $options: 'i' } },
        ],
      }
    : {};

  const rawClients = await Client.aggregate([
    { $match: matchStage },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: pageSize },
    {
      $lookup: {
        from: 'quotations',
        localField: '_id',
        foreignField: 'client',
        as: 'quotations',
        pipeline: [
          {
            $lookup: {
              from: 'sales', // <-- must match your actual users collection name
              localField: 'sale',
              foreignField: '_id',
              as: 'sale',
            },
          },
          {
            $unwind: {
              path: '$sale',
              preserveNullAndEmptyArrays: true,
            },
          },
        ],
      },
    },
  ]);

  const clients = rawClients.map((client) => sanitizeBson(client));
  const count = await Client.countDocuments(matchStage);

  return { clients, count };
}

/*
export const fetchClientsWithQuotations = async (q = "", page = 1, pageSize = 10) => {
  try {
    await connectToDB();

    const filter = q
      ? { name: { $regex: q, $options: "i" } }
      : {};

    const skip = (page - 1) * pageSize;

    const [clients, count] = await Promise.all([
      Client.find(filter)
        .skip(skip)
        .limit(pageSize)
        .lean()
        .then(async (clients) =>
          Promise.all(
            clients.map(async (client) => {
              const quotations = await Quotation.find({ quotation: client._id })
                .populate({
                  path: 'jobOrder',
                  populate: [
                    { path: 'client' },
                    {
                      path: 'quotation',
                      populate: [
                        { path: 'sale' },
                        { path: 'client' },
                      ]
                    },
                  ],
                })
                .populate('salesUser')
                .lean();

              const safeQuotations = quotations.map(quotation => ({
                ...quotation,
                _id: quotation._id.toString(),
               remainingAmount:
  quotation.remainingAmount !== undefined && quotation.remainingAmount !== null
    ? quotation.remainingAmount  
    : quotation.totalPrice,

                client: quotation.client?.toString?.() ?? quotation.client,
                jobOrder: quotation.jobOrder
                  ? {
                      ...quotation.jobOrder,
                      _id: quotation.jobOrder._id.toString(),
                      client: quotation.jobOrder.client
                        ? { ...quotation.jobOrder.client, _id: quotation.jobOrder.client._id.toString() }
                        : null,
                      quotation: quotation.jobOrder.quotation
                        ? {
                            ...quotation.jobOrder.quotation,
                            _id: quotation.jobOrder.quotation._id.toString(),
                            sale: quotation.jobOrder.quotation.sale
                              ? { ...quotation.jobOrder.quotation.sale, _id: quotation.jobOrder.quotation.sale._id.toString() }
                              : null,
                            client: quotation.jobOrder.quotation.client
                              ? { ...quotation.jobOrder.quotation.client, _id: quotation.jobOrder.quotation.client._id.toString() }
                              : null,
                            products: quotation.jobOrder.quotation.products?.map(prod => ({
                              ...prod,
                              _id: prod._id.toString(),
                            })) ?? [],
                          }
                        : null,
                    }
                  : null,
                salesUser: quotation.salesUser
                  ? { ...quotation.salesUser, _id: quotation.salesUser._id.toString() }
                  : null,
                products: Array.isArray(quotation.products)
                  ? quotation.products.map(prod => ({
                      ...prod,
                      _id: prod._id.toString(),
                    }))
                  : [],
              }));

              return {
                ...client,
                _id: client._id.toString(),
                quotations: safeQuotations,
              };
            })
          )
        ),
      Client.countDocuments(filter),
    ]);

    return { clients, count };
  } catch (error) {
    console.error('Error fetching clients with quotations:', error);
    throw new Error('Failed to fetch clients with quotations');
  }
};

*/

export const fetchClientsWithQuotationsAndPO = async () => {
  try {
    await connectToDB();

    const clients = await fetchAllClients();

    const clientsWithInfo = await Promise.all(clients.map(async (client) => {
      const quotations = await fetchQuotationsForClient(client._id);

      const jobOrders = await fetchJobOrdersForClient(client._id);
    
      return {
        ...client.toObject(),
        _id: client._id.toString(),
        quotations,
        jobOrders, 
      };
    }));

    return clientsWithInfo;
  } catch (error) {
    console.error('Error fetching clients with quotations and job orders:', error);
    throw new Error('Failed to fetch clients with quotations and job orders');
  }
};

export const fetchQuotationsForClient = async (clientId) => {
  const quotations = await Quotation.find({ client: clientId }).lean();
  return quotations.map(q => ({ ...q, _id: q._id.toString() }));
};

const fetchJobOrdersForClient = async (clientId) => {
  const jobOrders = await JobOrder.find({ client: clientId })
    .populate('client') 
    .populate('quotation') 
    .lean();
  return jobOrders;
};




  export const fetchSuppliers = async (q, page) => {
    const regex = new RegExp(q, "i");
    const ITEM_PER_PAGE = 10;
  
    try {
      await connectToDB()
      const count = await Supplier.countDocuments({ name: { $regex: regex } });
        const suppliers = await Supplier.find({ name: { $regex: regex } }).limit(ITEM_PER_PAGE).skip(ITEM_PER_PAGE * (page - 1));
        return { count, suppliers };
    } catch (err) {
        console.log(err);
        throw new Error('Failed to fetch Suppliers!')
    }
  };
  
  export const fetchSupplier = async (id) => {
    try {
      await connectToDB()
        const supplier = await Supplier.findById(id)
        return supplier
    } catch (err) {
        console.log(err);
        throw new Error('Failed to fetch Supplier!')
    }
  };


  /*
  export const fetchPurchaseOrders = async (supplierName, page = 1) => {
    const ITEMS_PER_PAGE = 10;
    let query = {};
    if (supplierName) {
      query['supplier.name'] = { $regex: new RegExp(supplierName, "i") };

    }
    try {
      await connectToDB();
      const count = await PurchaseOrder.countDocuments(query);
      const purchaseOrders = await PurchaseOrder.find(query)
        .populate('supplier')
        .populate('jobOrder')
        .populate({
          path: 'user',
          select: 'username'
        })
        .limit(ITEMS_PER_PAGE)
        .skip((page - 1) * ITEMS_PER_PAGE);
        console.log('PurchaseOrders after population:', purchaseOrders);

  
  
      return { count, purchaseOrders };
    } catch (err) {
      console.error('Error fetching purchase orders:', err);
      throw new Error('Failed to fetch purchase orders');
    }
  };

  */


  export const fetchPurchaseOrders = async (supplierName, page = 1) => {
  const ITEMS_PER_PAGE = 10;
  let query = {};

  if (supplierName) {
    query['supplier.name'] = { $regex: new RegExp(supplierName, "i") };
  }

  try {
    await connectToDB();

    const count = await PurchaseOrder.countDocuments(query);

    const purchaseOrdersDocs = await PurchaseOrder.find(query)
      .populate('supplier')
      .populate('jobOrder')
      .populate({
        path: 'user',
        select: 'username',
      })
      .limit(ITEMS_PER_PAGE)
      .skip((page - 1) * ITEMS_PER_PAGE);

    // ✅ Convert to plain JS objects
    const purchaseOrders = purchaseOrdersDocs.map((doc) =>
      sanitizeBson(doc.toObject({ virtuals: true }))
    );

    return { count, purchaseOrders };
  } catch (err) {
    console.error('Error fetching purchase orders:', err);
    throw new Error('Failed to fetch purchase orders');
  }
};

  

  export const fetchPurchaseOrder = async (id) => {
    try {
      await connectToDB();
      const purchaseOrder = await PurchaseOrder.findById(id).populate('supplier').populate('jobOrder').populate({
        path: 'user',
        select: 'username'
      }).populate({
        path: 'userPro',
 select: 'username email phone address'
      })
      return purchaseOrder;
    } catch (err) {
      console.error(err);
      throw new Error('Failed to fetch Quotation!');
    }
  };

  export const fetchUserCount = async () => {
    try {
      await connectToDB();
      const count = await User.countDocuments(); 
      return count;
    } catch (err) {
      throw new Error('Failed to fetch user count!');
    }
  };
  
  export const fetchClientCount = async () => {
    try {
      await connectToDB();
      const count = await Client.countDocuments(); 
      return count;
    } catch (err) {
      console.log("Error in fetchClientCount:", err);
      throw new Error('Failed to fetch client count!');
    }
  };


  

  
  export const fetchDepartmentCount = async () => {
    try {
      await connectToDB();

      const count = await Department.countDocuments(); 
      return count;
    } catch (err) {
      console.log("Error in fetchDepartmentCount:", err);
      throw new Error('Failed to fetch department count!');
    }
  };

  
  
  export const fetchEmployeeCount = async () => {
    try {
      await connectToDB();
      const count = await Employee.countDocuments(); 
      return count;
    } catch (err) {
      console.log("Error in fetchEmployeeCount:", err);
      throw new Error('Failed to fetch employee count!');
    }
  };

export const fetchManagersCount = async () => {
  try {
    await connectToDB();
    const uniqueManagers = await Department.distinct('directManager', {
      directManager: { $ne: null },
    });
    return uniqueManagers.length; // simple number
  } catch (err) {
    console.error('Error in fetchManagersCount:', err);
    throw new Error('Failed to fetch manager count!');
  }
};



  export const fetchSupplierCount = async () => {
    try {
      await connectToDB();
      const count = await Supplier.countDocuments(); 
      return count;
    } catch (err) {
      console.log("Error in fetchSupplierCount:", err);
      throw new Error('Failed to fetch supplier count!');
    }
  };
  






