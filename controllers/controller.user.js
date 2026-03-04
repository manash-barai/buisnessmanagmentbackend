

import Customer from "../models/Customer.js";
import paymentSchema from "../models/paymentSchema.js";
import Sale from "../models/Sale.js";
import {
  createUserService,
  getUsersService,
  getUserByIdService,
  updateUserService,
  deleteUserService,
  loginUserService,
} from "../services/userService.js";

export const createUser = async (req, res) => {
  try {
    const user = await createUserService(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const users = await getUsersService(page, limit);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const CustomareSaleDetailse = async (req, res) => {
  try {
    const { customerId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    // 1. Fetch the Customer to get their starting debt
    const customerDoc = await Customer.findById(customerId).lean();
    if (!customerDoc) return res.status(404).json({ message: "Not found" });

    // 2. Fetch all Sales and Payments
    const sales = await Sale.find({ customer: customerId }).select("totalAmount notes saleDate createdAt").lean();
    const payments = await paymentSchema.find({ customer: customerId }).select("totalAmount paymentDate notes createdAt").lean();

    // 3. Merge and Sort (Oldest First)
    // let ledger = [
    //   ...sales.map(s => ({ type: "CREDIT", amount: s.totalAmount, date: s.saleDate || s.createdAt, refId: s._id })),
    //   ...payments.map(p => ({ type: "DEBIT", amount: p.totalAmount, date: p.paymentDate || p.createdAt, refId: p._id }))
    // ];
    let ledger = [
      ...sales.map(s => ({
        type: "CREDIT",
        amount: s.totalAmount,
        date: s.saleDate || s.createdAt,
        refId: s._id,
        notes: s.notes || null
      })),
      ...payments.map(p => ({
        type: "DEBIT",
        amount: p.totalAmount,
        date: p.paymentDate || p.createdAt,
        refId: p._id,
        notes: p.notes || null
      }))
    ];
    ledger.sort((a, b) => new Date(a.date) - new Date(b.date));

    // 🔥 THE FIX IS HERE 🔥
    // Start runningDue with the customer's old opening balance, NOT zero.
    let runningDue = customerDoc.openingBalance || 0;

    const ledgerWithBalance = ledger.map((entry) => {
      if (entry.type === "CREDIT") {
        runningDue += entry.amount; // Sale adds to debt
      } else {
        runningDue -= entry.amount; // Payment (which includes rd) lowers debt
      }
      return { ...entry, balance: runningDue };
    });

    // Reverse for LIFO (Newest at top)
    const lifoLedger = [...ledgerWithBalance].reverse();

    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedLedger = lifoLedger.slice(startIndex, startIndex + limit);

    return res.status(200).json({
      ledger: paginatedLedger,
      totalDue: runningDue,
      currentPage: page,
      totalPages: Math.ceil(lifoLedger.length / limit),
      totalRecords: lifoLedger.length
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const createPayment = async (req, res) => {
  try {
    const {
      customer,
      amount,
      rd = 0,
      method = "CASH",
      paymentDate,
      notes
    } = req.body;

    // -----------------------------------------
    // 1️⃣ Validation
    // -----------------------------------------
    if (!customer) {
      return res.status(400).json({ message: "Customer ID is required" });
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    const customerDoc = await Customer.findById(customer);
    if (!customerDoc) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // -----------------------------------------
    // 2️⃣ Timezone & Date Fix
    // -----------------------------------------
    // If the frontend didn't send a date, or only sent "YYYY-MM-DD" (length 10),
    // we force the EXACT current time to prevent the 05:30 AM midnight bug.
    let finalPaymentDate = new Date();
    if (paymentDate && paymentDate.length > 10) {
      finalPaymentDate = new Date(paymentDate);
    }

    // -----------------------------------------
    // 3️⃣ Create Payment
    // -----------------------------------------
    // Note: The pre("validate") hook in your schema will automatically 
    // calculate totalAmount = amount + rd, and set remainingAmount.
    const payment = await paymentSchema.create({
      customer,
      amount,
      rd,
      method,
      paymentDate: finalPaymentDate,
      notes
    });

    // -----------------------------------------
    // 4️⃣ Apply Payment to Unpaid Sales (FIFO)
    // -----------------------------------------
    // We use totalAmount because the discount (rd) also pays off the debt
    let remainingToDistribute = payment.totalAmount;

    // Find all sales where the customer still owes money, sorted oldest first
    const unpaidSales = await Sale.find({
      customer,
      dueAmount: { $gt: 0 }
    }).sort({ createdAt: 1 });

    for (const sale of unpaidSales) {
      if (remainingToDistribute <= 0) break;

      // Find out how much we can apply to this specific sale
      const amountToApply = Math.min(remainingToDistribute, sale.dueAmount);

      sale.paidAmount += amountToApply;
      sale.dueAmount -= amountToApply;
      remainingToDistribute -= amountToApply;

      await sale.save();
    }

    // Update the payment record to show if there is any unapplied cash left over
    payment.remainingAmount = remainingToDistribute;
    await payment.save();

    // -----------------------------------------
    // 5️⃣ Recalculate Customer Master Balance
    // -----------------------------------------
    // Instead of doing math manually, we ask the database to sum up all dueAmounts.
    // This guarantees the customer's balance is never wrong.
    const totalDueResult = await Sale.aggregate([
      { $match: { customer: customerDoc._id } },
      { $group: { _id: null, totalDue: { $sum: "$dueAmount" } } }
    ]);

    const finalTotalDue = totalDueResult[0]?.totalDue || 0;

    customerDoc.totalDue = finalTotalDue;
    customerDoc.lastPayment = amount; // Store the physical cash amount, not the total with discount
    customerDoc.lastPaymentDate = payment.paymentDate;
    await customerDoc.save();

    // -----------------------------------------
    // 6️⃣ Send Response
    // -----------------------------------------
    return res.status(201).json({
      message: "Payment applied successfully",
      currentBalance: finalTotalDue,
      payment
    });

  } catch (error) {
    console.error("Create Payment Error:", error);
    return res.status(500).json({ message: "Server error while processing payment" });
  }
};



export const getUserById = async (req, res) => {
  try {
    const user = await getUserByIdService(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = await updateUserService(req.params.id, req.body);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await deleteUserService(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const loginUser = async (req, res) => {
  console.log("Login attempt with data:", req.body);
  try {
    res.json("Login attempt received");
    const { identifier, password } = req.body;
    const user = await loginUserService(identifier, password);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};