import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
  name: {
    type:String,
    unique:true
  },
  phone: String,
  whatsApp: String,
  address: String,
  lastPayment: Number,
  lastPaymentDate: {
    type: Date,
    default: Date.now
  },
  totalDue: Number,
  
  notes: {
    type: String,
    trim: true
  }
}, { timestamps: true });

export default mongoose.model("Customer", customerSchema);
