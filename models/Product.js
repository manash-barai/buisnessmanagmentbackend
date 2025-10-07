import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  unitCategory: {
    type: String,
    enum: ["KG",  "bag", "tray"],
    default: "KG"
  },
  currentStock: {
    type: Number  },
  currentStock_bag: {
    type: Number
  },
  img:String,

}, { timestamps: true });

export default mongoose.model("Product", productSchema);
