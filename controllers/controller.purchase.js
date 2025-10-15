import {
  createPurchaseService,
  getPurchasesService,
  getPurchaseByIdService,
  updatePurchaseService,
  deletePurchaseService,
} from "../services/purchaseService.js";

import Lat from "../models/Lat.js";
import Product from "../models/Product.js";
import Supplier from "../models/Supplier.js";
import Purchase from "../models/Purchase.js";
import { createActivityLogService } from "../services/activityLogService.js";

export const createPurchase = async (req, res) => {
  

  try {
    const {
      supplier,
      products,
      quantity,
      Price_PerUnit,
      totalAmount,
      paidAmount,
      dueAmount,
      purchaseDate,
      totalBag,
      createdBy,
    } = req.body;
   
    // Basic validation
    if (!supplier || !products || !quantity || !Price_PerUnit || !totalAmount || totalBag === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate product and supplier existence
    const [product, supply] = await Promise.all([
      Product.findById(products),
      Supplier.findById(supplier)
    ]);

    if (!product) return res.status(404).json({ error: "Product not found" });
    if (!supply) return res.status(404).json({ error: "Supplier not found" });

    // Build the purchase data
    const purchaseData = {
      supplier,
      products,
      quantity: Number(quantity),
      Price_PerUnit: Number(Price_PerUnit),
      totalAmount: Number(totalAmount),
      paidAmount: {
        amount: Number(paidAmount) || 0,
        paymentDate: new Date()
      },
      dueAmount: Number(dueAmount || 0),
      totalBag: Number(totalBag),
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      createdBy
    };

    // Prepare stock update based on unit category
    const productUpdate = {
       currentStock_bag: (product.currentStock_bag || 0) + Number(totalBag),
       currentStock: (product.currentStock || 0) + (Number(quantity))
    };
    

    // Update the product stock
   const productsUpdate = await Product.findByIdAndUpdate(
      products,
      productUpdate,
      { new: true }
    );

    // Create the purchase
    const purchase = await Purchase.create(purchaseData);

    // Update supplier payment info
    const updatedSupplier = await Supplier.findByIdAndUpdate(
      supplier,
      {
        $inc: {
          totalPayment: purchaseData.totalAmount,
          totalDue: purchaseData.dueAmount
        },
       
        lastPurchase: purchase._id,
      },
      { new: true }
    );

    // Generate unique LAT number
    let uniqueLatNumber;
    do {
      uniqueLatNumber = Math.floor(1000 + Math.random() * 9000);
    } while (await Lat.exists({ latNumber: uniqueLatNumber }));

    const latData = {
      latNumber: `${supply.name.slice(0, 2).toUpperCase()}${uniqueLatNumber}`,
      purchase: purchase._id,
      supplier: purchase.supplier,
      product: products,
      pendingQuantity: Number(quantity),
      unit: productsUpdate.unitCategory,
      pendingBag: Number(totalBag),
    };

    
    const lat = await Lat.create(latData);
    console.log("Created LAT:", lat);
    // Log the activity
    await createActivityLogService({
      action: "Create_Purchase",
      user: createdBy,
      purchase: purchase._id,
      product: products,
      supplier: supplier,
      details: `Created purchase with LAT number ${lat.latNumber} for supplier ${supply.name} and product ${product.name}`
    });

    // Return populated response
    const populatedPurchase = await Purchase.findById(purchase._id)
      .populate("supplier")
      .populate("products")
      .populate("createdBy");

    res.status(201).json([populatedPurchase]);

  } catch (err) {
    console.error("Create Purchase Error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};


export const getPurchases = async (req, res) => {
  try {
    const purchases = await getPurchasesService();
    res.json(purchases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getPurchaseById = async (req, res) => {
  try {
    const purchase = await getPurchaseByIdService(req.params.id);
    if (!purchase) return res.status(404).json({ error: "Purchase not found" });
    res.json(purchase);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updatePurchase = async (req, res) => {
  try {
    const purchase = await updatePurchaseService(req.params.id, req.body);
    if (!purchase) return res.status(404).json({ error: "Purchase not found" });
    res.json(purchase);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deletePurchase = async (req, res) => {
  try {
    const purchase = await deletePurchaseService(req.params.id);
    if (!purchase) return res.status(404).json({ error: "Purchase not found" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};