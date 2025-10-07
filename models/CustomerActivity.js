import mongoose from "mongoose";

const CustomerActivitySchema = new mongoose.Schema({
  customer:{ type: mongoose.Schema.Types.ObjectId, ref: "Sale" },
  purChess: { type: mongoose.Schema.Types.ObjectId, ref: "Purchase" },
  Return:{ type: mongoose.Schema.Types.ObjectId, ref: "Return" },
  lat:{ type: mongoose.Schema.Types.ObjectId, ref: "Return" }
}, { timestamps: true });

export default mongoose.model("CustomerActivity", CustomerActivitySchema);
