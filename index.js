import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
// Routes
import productRoutes from "./routes/route.product.js";
import customerRoutes from "./routes/route.customer.js";
import supplierRoutes from "./routes/route.supplier.js";
import saleRoutes from "./routes/route.sale.js";
import purchaseRoutes from "./routes/route.purchase.js";
import returnRoutes from "./routes/route.return.js";
import userRoutes from "./routes/route.user.js";
import activityLogRoutes from "./routes/route.activityLog.js";
import latRoutes from "./routes/route.lat.js";

// ✅ Load environment variables first
dotenv.config();

// ✅ Then connect to DB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
  res.send("Inventory Management System API");
});
// Routes
app.use("/api/products", productRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/returns", returnRoutes);
app.use("/api/lats", latRoutes);
app.use("/api/users", userRoutes);
app.use("/api/activity-logs", activityLogRoutes);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
