import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  role: { type: String, enum: ["admiin", "staff"], default: "staff" },
  phone: { type: String, unique: true, sparse: true }, // sparse allows nulls to not violate uniqueness
  whatsapp: String,
  email: { type: String, unique: true, sparse: true }, // sparse allows nulls to not violate uniqueness
  password: { type: String, required: true },
  address: String,
  block: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("User", userSchema);
