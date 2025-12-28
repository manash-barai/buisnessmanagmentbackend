import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true
    },

    // Actual cash/upi/bank received
    amount: {
      type: Number,
      required: true
    },

    // Rounding / remaining difference
    rd: {
      type: Number,
      default: 0
    },

    // amount + rd (auto calculated)
    totalAmount: {
      type: Number,
      required: true
    },

    paymentDate: {
      type: Date,
      default: Date.now
    },

    method: {
      type: String,
      enum: ["CASH", "UPI", "BANK"],
      default: "CASH"
    },

    notes: String
  },
  { timestamps: true }
);

// Auto calculate totalAmount
paymentSchema.pre("validate", function (next) {
  this.totalAmount = this.amount + (this.rd || 0);
  next();
});

export default mongoose.model("Payment", paymentSchema);
