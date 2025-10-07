import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema({
  name: String,
  phone: String,
  address: String,
  totalPayment: Number,
  totalDue: Number,
  lastPurchase: { type: mongoose.Schema.Types.ObjectId, ref: "Purchase" },
  lastPayment: Number,
  lastPaymentDate: {
    type: Date,
    default: Date.now
  },
}, { timestamps: true });

export default mongoose.model("Supplier", supplierSchema);
