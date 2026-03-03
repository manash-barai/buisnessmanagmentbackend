import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true
    },
    
    amount: { type: Number, required: true }, // Physical cash/bank
    rd: { type: Number, default: 0 },         // Rounding/Discount
    totalAmount: { type: Number, required: true }, // amount + rd
    remainingAmount: { type: Number }, // How much of THIS payment is left to be applied
    paymentDate: { type: Date, default: Date.now },
    method: { type: String, enum: ["CASH", "UPI", "BANK"], default: "CASH" },
    notes: String,
    returned:{ type: Boolean, default: false },
    saleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sale",
     
    },
  },
  { timestamps: true }
);

paymentSchema.pre("validate", function (next) {
  this.totalAmount = (this.amount || 0) + (this.rd || 0);
  if (this.isNew) this.remainingAmount = this.totalAmount;
  next();
});

export default mongoose.model("Payment", paymentSchema);