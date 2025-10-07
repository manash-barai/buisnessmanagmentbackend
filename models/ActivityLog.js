import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  action: String,
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
  purchase: { type: mongoose.Schema.Types.ObjectId, ref: "Purchase" },
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  description: String,
}, { timestamps: true });

export default mongoose.model("ActivityLog", activityLogSchema);
