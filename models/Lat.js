import mongoose from "mongoose";


const LatSchema = new mongoose.Schema({
  latNumber: { type: String, required: true, unique: true },
  purchase: { type: mongoose.Schema.Types.ObjectId, ref: "Purchase", required: true },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  Customer: [{
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    quantity: Number,
    pricePerUnit: Number,
    sellingBags: Number,
    sellingQuantity: Number,
    sellingWeightLoss: Number,
    saleId: { type: mongoose.Schema.Types.ObjectId, ref: "Sale" },
  }],
  pendingQuantity: {
    type: Number,
  },
  pendingBag: {
    type: Number,
  },
 
  
}, { timestamps: true });


export default mongoose.model("Lat", LatSchema);
