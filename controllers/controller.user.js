

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
    const users = await getUsersService();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const CustomareSaleDetailse = async (req, res) => {
  try {
    const { customerId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (!customerId) {
      return res.status(400).json({ message: "Customer ID is required" });
    }

    // 1️⃣ Fetch sales (CREDIT)
    const sales = await Sale.find({ customer: customerId })
      .select("totalAmount saleDate createdAt")
      .lean();

    // 2️⃣ Fetch payments (DEBIT)
    const payments = await paymentSchema.find({ customer: customerId })
      .select("totalAmount paymentDate createdAt")
      .lean();

    // 3️⃣ Build ledger
    let ledger = [];

    sales.forEach((sale) => {
      ledger.push({
        type: "CREDIT",
        label: "Sale",
        amount: sale.totalAmount,
        date: sale.saleDate || sale.createdAt,
        refId: sale._id
      });
    });

    payments.forEach((pay) => {
      ledger.push({
        type: "DEBIT",
        label: "Payment",
        amount: pay.totalAmount,
        date: pay.paymentDate || pay.createdAt,
        refId: pay._id
      });
    });

    // 4️⃣ Sort by date (oldest first)
    ledger.sort((a, b) => new Date(a.date) - new Date(b.date));

    // 5️⃣ Calculate FULL running balance
    let runningDue = 0;
    const ledgerWithBalance = ledger.map((entry) => {
      if (entry.type === "CREDIT") {
        runningDue += entry.amount;
      } else {
        runningDue -= entry.amount;
      }

      return {
        ...entry,
        balance: runningDue
      };
    });

    // 6️⃣ Pagination
    const totalRecords = ledgerWithBalance.length;
    const totalPages = Math.ceil(totalRecords / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedLedger = ledgerWithBalance.slice(startIndex, endIndex);

    // 7️⃣ Opening balance (VERY IMPORTANT)
    const openingBalance =
      startIndex > 0 ? ledgerWithBalance[startIndex - 1].balance : 0;

    return res.status(200).json({
      customerId,
      openingBalance,     // 👈 show at top of page
      totalDue: runningDue,
      pagination: {
        page,
        limit,
        totalRecords,
        totalPages
      },
      ledger: paginatedLedger
    });

  } catch (error) {
    console.error("Ledger Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
export const createPayment = async (req, res) => {
  try {
    console.log(req.body)
    const { customer, amount, rd = 0, method, paymentDate, notes } = req.body;
    // 1️⃣ Validation
    if (!customer) {
      return res.status(400).json({ message: "Customer is required" });
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    const customerDoc = await Customer.findById(customer);
    if (!customerDoc) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // 2️⃣ Create payment (totalAmount auto-calculated)
    const payment = await paymentSchema.create({
      customer,
      amount,
      rd,
      method,
      paymentDate,
      notes
    });

    let remainingPayment = payment.totalAmount;

    // 3️⃣ FIFO unpaid sales
    const unpaidSales = await Sale.find({
      customer,
      dueAmount: { $gt: 0 }
    }).sort({ saleDate: 1 });

    for (const sale of unpaidSales) {
      if (remainingPayment <= 0) break;

      if (remainingPayment >= sale.dueAmount) {
        remainingPayment -= sale.dueAmount;
        sale.paidAmount += sale.dueAmount;
        sale.dueAmount = 0;
      } else {
        sale.paidAmount += remainingPayment;
        sale.dueAmount -= remainingPayment;
        remainingPayment = 0;
      }

      await sale.save();
    }

    // 4️⃣ Update customer summary (NOT ledger logic)
    customerDoc.lastPayment = amount;
    customerDoc.lastPaymentDate = payment.paymentDate;

    customerDoc.totalDue = Math.max(
      (customerDoc.totalDue || 0) - payment.totalAmount,
      0
    );

    await customerDoc.save();

    return res.status(201).json({
      message: "Payment applied successfully",
      payment: {
        _id: payment._id,
        cashReceived: payment.amount,
        rd: payment.rd,
        totalAdjusted: payment.totalAmount
      }
    });

  } catch (error) {
    console.error("Create Payment Error:", error);
    res.status(500).json({ message: "Server error" });
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