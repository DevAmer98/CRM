import { ObjectId } from 'mongodb'; // Import ObjectId for validation
import { User, Client, Supplier, Quotation, PurchaseOrder, JobOrder, Sale, Coc, Pl, Approve, ApprovePo, Employee, Leave, Shift } from "@/app/lib/models";
import { connectToDB } from './utils';
import { ROLES } from './role';


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

  export const fetchAllUsers = async () => {
    try {
      await connectToDB();
      const users = await User.find({});
      return users;
    } catch (err) {
      console.log("Error in fetchAllUsers:", err);
      throw new Error('Failed to fetch users!');
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


  export const fetchLeaves = async (q, page) => {
  const regex = new RegExp(q, "i");
  const ITEMS_PER_PAGE = 10;
  try {
    await connectToDB();

    const count = await Leave.countDocuments({
      $or: [
        { leaveType: { $regex: regex } },
        { addressWhileOnVacation: { $regex: regex } },
      ],
    });
    

    const leaves = await Leave.find({
      $or: [
        { leaveType: { $regex: regex } },
        { addressWhileOnVacation: { $regex: regex } },
      ],
    })
.populate('employee', 'name leaveBalance contractStartDate')
      .populate('approvals.admin.approvedBy', 'username')
      .populate('approvals.hrAdmin.approvedBy', 'username')
      .populate('approvals.admin.rejectedBy', 'username')    // ✅ ADD THIS
      .populate('approvals.hrAdmin.rejectedBy', 'username')  // ✅ AND THIS
      .limit(ITEMS_PER_PAGE)
      .skip(ITEMS_PER_PAGE * (page - 1))
      .sort({ createdAt: -1 });

    return { count, leaves };
  } catch (err) {
    console.error(err);
    throw new Error("Failed to fetch Leaves!");
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
    if (!ObjectId.isValid(id)) throw new Error(`Invalid Shift ID: ${id}`);
    await connectToDB();

    const shift = await Shift.findById(id).populate('employee', 'name employeeNo contactMobile');

    if (!shift) throw new Error(`Shift with ID ${id} not found`);
    return shift;
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

  export const fetchAllQuotations = async () => {
    try {
      await connectToDB();
      const quotations = await Quotation.find({});
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
      const jobOrders = await JobOrder.find({});
      return jobOrders;
    } catch (err) {
      console.log("Error in jobOrders:", err);
      throw new Error('Failed to fetch jobOrders!');
    }
  };
  
  
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

export const fetchQuotation = async (id) => {
  try {
    await connectToDB();
    const quotation = await Quotation.findById(id).populate('client').populate('sale').populate({
      path: 'user',
      select: 'username'
    })
    return quotation;
  } catch (err) {
    console.error(err);
    throw new Error('Failed to fetch Quotation!');
  }
};


  
export const fetchJobOrders = async (q, page) => {
  const regex = new RegExp(q, "i");
  const ITEM_PER_PAGE = 10;

  try {
    await connectToDB();
    const count = await JobOrder.countDocuments({ poNumber: { $regex: regex } });

    const jobOrders = await JobOrder.find({ poNumber: { $regex: regex } })
      .populate('quotation')
      .populate('client')
      .limit(ITEM_PER_PAGE)
      .skip((page - 1) * ITEM_PER_PAGE);
    return { count, jobOrders }; // Fix the variable name here from `jobs` to `jobOrders`
  } catch (err) {
    console.log(err);
    throw new Error('Failed to fetch jobs!');
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
  






