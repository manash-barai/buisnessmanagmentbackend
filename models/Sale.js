import mongoose from "mongoose";

const saleSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
  latId: { type: mongoose.Schema.Types.ObjectId, ref: "Lat" },

  products: [{
    latId: { type: mongoose.Schema.Types.ObjectId, ref: "Lat" },
    quantity: {
      type: Number,
      required: true
    },
    unitPrice: {
      type: Number,
      required: true
    },
    totalBag: {
      type: Number,
    },
    discount: { type: Number, default: 0 },
    loseQuantity: Number,
    loseWeight: Number,
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    totalAmount: {
      type: Number,
      required: true  
    },
    
  }],
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  dueAmount: { type: Number, default: 0 },
  discountTotal: { type: Number, default: 0 },
  saleDate: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

export default mongoose.model("Sale", saleSchema);
