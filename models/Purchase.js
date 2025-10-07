import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema({
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
  products: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },

  quantity: {
    type: Number,
    required: true,
  },
  Price_PerUnit: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },

  paidAmount: [{
    amount: Number,
    paymentDate: {
      type: Date
    }
  }],
  dueAmount: {
    type: Number
  },
  totalBag: {
    type: Number,
    required: true
  },
  purchaseDate: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

}, { timestamps: true });

export default mongoose.model("Purchase", purchaseSchema);
