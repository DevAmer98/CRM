import mongoose from "mongoose";
import { ROLES } from "./role";

const {Schema} =mongoose;
// Mongoose Schema
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
      default: ROLES.USER
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
      required: true,
      unique: true,
    },
    address: {
      type: String,
      required: true,

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
      required: true,
    },
    contactMobile: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    address: {
      type: String,
      required: true,

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
      required: true,
      unique: true,
    },
    address: {
      type: String,
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
      required: true,
    },
    passportExpirationDate: {
      type: String,
    },
    dateOfBirth: {
      type: String,
      required: true,
    },
    jobTitle: {
      type: String,
      required: true,
    },
    directManager: {
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
   quotation: {
    type: Schema.Types.ObjectId,
    ref: 'Quotation',
    required:true,
   },
   sale: {
    type: Schema.Types.ObjectId,
    ref: 'Sale',
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
    paymentTerm: {
      type: String,
      required: true,
    },
    paymentDelivery: {
      type: String,
      required: true,
    },
    note: {
      type: String,
      required: true,
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

  poNumber:{
    type:String,
    required:true
  },

  poDate:{
    type:String,
    required:true,
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
}, { timestamps: true })








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




