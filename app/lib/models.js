import mongoose from "mongoose";
import { ROLES } from "./role.js";

const {Schema} =mongoose;

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      min: 3,
      max: 20,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    img: {
      type: String,
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.USER,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    phone: {
      type: String,
    },
    address: {
      type: String,
    },

    employee: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: false,
    },
  },
  { timestamps: true }
);



const clientSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: false,
      min: 3,
      max: 20,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    contactName: {
      type: String,
      required: true,
    },
    contactMobile: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: false,
      unique: false,
    },
    address: {
      type: String,
      required: false,

    },
  },
  { timestamps: true }
);

const salesSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: false,
      min: 3,
      max: 20,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    contactName: {
      type: String,
      required: false,
    },
    contactMobile: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: false,
      unique: true,
    },
    address: {
      type: String,
      required: false,

    },
  },
  { timestamps: true }
);

const supplierSchema = new Schema(
  {
    supplierId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true,
      unique: true,
      min: 1,
      max: 50,
    },
    phone: {
      type: String,
      required: false,
    },
    contactName: {
      type: String,
      required: false,
    },
    contactMobile: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: false,
      unique: false,
    },
     VAT: {
      type: String,
        required: false,
    },
      CR: {
      type: String,
      required: false,
  },
    address: {
      type: String,
            required: false,

    },
  },
  { timestamps: true }
);

 

const employeeSchema = new Schema(
  {
    employeeNo: {
      type: String,
      required:true
    },	
    name: {
      type: String,
      required: true,
    },
    contactMobile: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: false,
      unique: false,
    },
    iqamaNo: {
      type: String,
      required: true,
      unique: true,
    },
    iqamaExpirationDate: {
      type: String,
    },
    passportNo: {
      type: String,
      required: false,
    },
    passportExpirationDate: {
      type: String,
      required: false,

    },
    dateOfBirth: {
      type: String,
      required: true,
    },
    jobTitle: {
      type: String,
      required: true,
    },
    passportExpirationDate: {
      type: String,
    },
    contractDuration: {
      type: String,
    },
    contractStartDate: {
      type: String,
    },
    contractEndDate: {
      type: String,
    },
    department: { type: Schema.Types.ObjectId, ref: 'Department', index: true },
    leaveBalance: {
  type: Number,
  default: 0, // or set an initial balance if you want (e.g., 30)
},

  },
  { timestamps: true }
);



const quotationSchema = new Schema(
  {

    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false 
    },

    quotationId: {
      type: String,
      required: true
    },
    revisionNumber: {
      type: Number,
      default: 0
    },
    sale: {
      type: Schema.Types.ObjectId,
      ref: 'Sale',
      required: true
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true
    },

    projectName: {
      type: String,
      unique: false,
    },
    projectLA: {
      type: String,
    },
     products:  [
      {
        productCode: {
          type: String,
        },
        unitPrice: {
          type: Number,
        },
        unit: {
          type: Number,
        },
        qty: {
          type: Number,
        },
        description: {
          type: String,
        },
        titleAbove: { type: String },
      },
    ],
    paymentTerm: {
      type: String,
    },
    paymentDelivery: {
      type: String,
    },
    note: {
      type: String,
    },
    validityPeriod: {
      type: String,
    },
    excluding: {
      type: String,
    },
     totalPrice: {              
      type: Number,
      required: true,
      default: 0,
    },

remainingAmount: {        
    type: Number,
    required: true,
    default: 0,
  },

  paymentStatus: {
  type: String,
  enum: ['unpaid', 'partial', 'paid'],
  default: 'unpaid',
},

    currency: {
  type: String,
  enum: ['USD', 'SAR'],
  default: 'USD',
  required: true
},
  },
  { timestamps: true }
);



const purchaseOrderSchema = new Schema(
  {
     user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false 
    },
     userPro: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true, // Changed from false to true
      validate: {
        validator: async function(userId) {
          // Validate that the user has procurement role
          const User = this.model('User');
          const user = await User.findById(userId);
          return user && (user.role === ROLES.USER_PROCUREMENT);
        },
        message: 'User must have procurement role (proAdmin or userPro) to create purchase orders'
      }
    },

    purchaseId: {
      type: String,
      required: true
    },
    revisionNumber: {
      type: Number,
      default: 0
    },
    supplier: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true
    
    },
   jobOrder: {
    type: Schema.Types.ObjectId,
    ref: 'JobOrder',
    required:true,
   },

   deliveryLocation: {
    type: String,
    required: true,
  },

    products:  [
      {
        productCode: {
          type: String,
          required: true,
        },
        unitPrice: {
          type: Number,
          required: true,
        },
        unit: {
          type: Number,
          required: true,
        },
        qty: {
          type: Number,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
      },
    ],
    totalPrice: {              
      type: Number,
      required: true,
      default: 0,
    },
    paymentTerm: {
      type: String,
      required: true,
    },
    deliveryTerm: {
      type: String,
      required: true,
    },
    validityPeriod: {
      type: String,
      required: true,
    },
    delayPenalties: {
      type: String,
      required: true,
    },
    sellingPolicy: {
      type: String,
      required: true,
    },
    currency: {
  type: String,
  enum: ['USD', 'SAR'],
  default: 'USD',
  required: true
},

remainingAmount: {        
    type: Number,
    required: true,
    default: 0,
  },

  paymentStatus: {
  type: String,
  enum: ['unpaid', 'partial', 'paid'],
  default: 'unpaid',
},

  },
  { timestamps: true }
);




const cocSchema = new Schema(
  {

    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false 
    },
    cocId: {
      type: String,
      required: true
    },
    revisionNumber: {
      type: Number,
      default: 0
    },
    jobOrder:{
      type: Schema.Types.ObjectId,
      ref: 'JobOrder',
      required: true
    },
    sale: {
      type: Schema.Types.ObjectId,
      ref: 'Sale',
      required:true,
     },
    client: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true
    },
    quotation: {
      type: Schema.Types.ObjectId,
      ref: 'Quotation', 
      required: true,
    },
    deliveryLocation: {
      type: String,
      required: true
    },
    products:  [
      {
        productCode: {
          type: String,
          required: true,
        },
        qty: {
          type: Number,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);


const plSchema = new Schema(
  {
    pickListId: {
      type: String,
      required: true
    },
    revisionNumber: {
      type: Number,
      default: 0
    },
    jobOrder:{
      type: Schema.Types.ObjectId,
      ref: 'JobOrder',
      required: true
    },
    sale: {
      type: Schema.Types.ObjectId,
      ref: 'Sale',
      required:true,
     },
    client: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true
    },
    quotation: {
      type: Schema.Types.ObjectId,
      ref: 'Quotation', 
      required: true,
    },
    deliveryLocation: {
      type: String,
      required: true
    },
    products:  [
      {
        productCode: {
          type: String,
          required: true,
        },
        qty: {
          type: Number,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);


const jobOrderSchema = new Schema({
  jobOrderId: {
    type: String,
    required: true
  },
  poNumber: {
    type: String,
    required: true
  },
  poDate: {
    type: String,
    required: true,
  },
  projectType: {
    type: String,
    required: true,
  },
  projectStatus: {
    type: String,
    enum: ['OPEN', 'CLOSE'],
    default: 'OPEN'
  },
  client: {
    type: Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
  },
  quotation: {
    type: Schema.Types.ObjectId,
    ref: 'Quotation',
    required: true,
  },
  value: { // 💰 value including VAT (if SAR)
    type: Number,
    required: true,
    default: 0,
  },
  paidAmount: { 
    type: Number,
      default: 0,
    },
  baseValue: { // 💸 value before VAT (only applies to SAR)
    type: Number,
    required: function () { return this.currency === 'SAR'; },
    default: 0,
  },
  currency: {
    type: String,
    enum: ['USD', 'SAR'],
    default: 'USD',
    required: true
  },
  remainingAmount: {
    type: Number,
    required: true,
    default: 0,
  }
}, { timestamps: true });



const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  deadline: Date,
  comment: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending', 'in-progress', 'done'], default: 'pending' },
}, { timestamps: true });


const ticketSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  deadline: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending', 'in-progress', 'done'], default: 'pending' },
}, { timestamps: true });



const leaveSchema = new mongoose.Schema({
  employee: {
    type: Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  contactMobile: {
       type: String,
    required: true
  },
  leaveType: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: function () {
      return ['Unpaid Leave', 'Sick Leave', 'Special Leave'].includes(this.leaveType);
    }
  },
  startDate: {
    type: String,
    required: true
  },
  endDate: {
    type: String,
    required: true
  },
  addressWhileOnVacation: String,
  exitReentryVisa: {
    type: String,
    required: true
  },
   leaveBalance: Number,            
  pastLeaveBalance: Number,       
  balanceDeducted: {            
    type: Boolean,
    default: false
  },
approvals: {
  admin: {
    approved: Boolean,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    rejected: Boolean,
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: Date,
    rejectionReason: {
      type: String,
      required: function() { 
        return this.rejected === true;
      }
    }
  },
  hrAdmin: {
    approved: Boolean,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    rejected: Boolean,
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: Date,
    rejectionReason: {
      type: String,
      required: function() {
        return this.rejected === true;
      }
    }
  },
},


}, { timestamps: true });


const shiftSchema = new mongoose.Schema({
  employee: {
    type: Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  date: {
    type: String,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: false
  }
}, { timestamps: true });



const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  directManager: {
    type: Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  employees: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    }
  ],
}, { timestamps: true });








 
export const Coc = mongoose.models.Coc || mongoose.model("Coc", cocSchema);
export const Pl = mongoose.models.Pl || mongoose.model("Pl", plSchema);
export const Sale = mongoose.models.Sale || mongoose.model("Sale", salesSchema);
export const PurchaseOrder = mongoose.models.PurchaseOrder || mongoose.model("PurchaseOrder", purchaseOrderSchema);
export const JobOrder = mongoose.models.JobOrder || mongoose.model("JobOrder", jobOrderSchema);
export const Quotation = mongoose.models.Quotation || mongoose.model("Quotation", quotationSchema);
export const Supplier = mongoose.models.Supplier || mongoose.model("Supplier", supplierSchema);
export const User = mongoose.models.User || mongoose.model("User", userSchema);
export const Client = mongoose.models.Client || mongoose.model("Client", clientSchema);
export const Employee = mongoose.models.Employee || mongoose.model("Employee", employeeSchema);
export const Task = mongoose.models.Task || mongoose.model("Task", taskSchema);
export const Ticket = mongoose.models.Ticket || mongoose.model("Ticket", ticketSchema)
export const Leave = mongoose.models.Leave || mongoose.model("Leave", leaveSchema)
export const Shift = mongoose.models.Shift || mongoose.model("Shift", shiftSchema)
export const Department = mongoose.models.Department || mongoose.model("Department", departmentSchema)


 




