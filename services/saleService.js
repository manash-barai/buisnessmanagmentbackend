import Sale from "../models/Sale.js";
import Product from "../models/Product.js";
import Customer from "../models/Customer.js";
import Lat from "../models/Lat.js";
import paymentSchema from "../models/paymentSchema.js";

// services/saleService.js
export const createSaleService = async (data) => {
  try {
    // 1. Prepare Sale Data
    const saleData = {
      customer: data.customer,
      saleDate: data.saleDate ? new Date(data.saleDate) : new Date(),
      totalAmount: data.totalAmount, // The full bill amount
      dueAmount: data.totalAmount,   // Initially full amount is due
      paidAmount: 0,
      discountTotal: Number(data.discountTotal) || 0, // Store discount for record
      notes: data.notes || "",
      products: data.products.map(product => ({
        product: product.product,
        quantity: product.quantity,
        totalBag: product.totalBags || 0,
        unitPrice: product.Price_PerUnit || 0,
        totalAmount: (product.Price_PerUnit || 0) * product.quantity,
        latId: product.lot
      }))
    };

    // 2. Verify Customer
    const customer = await Customer.findById(data.customer);
    if (!customer) throw new Error(`Customer not found with id: ${data.customer}`);

    // 3. Update Stocks and Lat Records (Loops remain same)
    for (const item of data.products) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { currentStock: -Number(item.quantity), currentStock_bag: -Number(item.totalBags || 0) }
      });
      await Lat.findByIdAndUpdate(item.lot, {
        $inc: { pendingQuantity: -Number(item.quantity), pendingBag: -Number(item.totalBags || 0) }
      });
    }

    // 4. Save the Sale Record
    const sale = new Sale(saleData);
    await sale.save();

    // 5. Link Sale to Lat Records (Loop remains same)
    for (const item of sale.products) {
      await Lat.findByIdAndUpdate(item.latId, {
        $push: {
          Customer: {
            customer: data.customer,
            quantity: item.quantity,
            pricePerUnit: item.unitPrice,
            sellingBags: item.totalBag,
            saleId: sale._id
          }
        }
      });
    }

    // 6. FIFO PAYMENT LOGIC with DISCOUNT (RD)
    const cashReceived = Number(data.payment) || 0;
    const discountGiven = Number(data.discountTotal) || 0;
    
    // The "Total Benefit" to the customer is Cash + Discount
    let amountToDistribute = cashReceived + discountGiven;

    if (amountToDistribute > 0) {
      // Create Payment Entry
      // Note: your schema's pre-validate hook calculates totalAmount = amount + rd
      const paymentEntry = new paymentSchema({
        customer: data.customer,
        amount: cashReceived,      // Actual cash
        rd: discountGiven,         // Discount stored as rd
        method: "CASH",
        notes: `Sale payment. Cash: ${cashReceived}, Discount: ${discountGiven}`,
        saleId: sale._id
      });
      await paymentEntry.save();

      // Find all sales with due balance (Oldest First)
      const pendingSales = await Sale.find({ 
        customer: data.customer, 
        dueAmount: { $gt: 0 } 
      }).sort({ saleDate: 1 });

      for (let s of pendingSales) {
        if (amountToDistribute <= 0) break;

        const paymentForThisSale = Math.min(s.dueAmount, amountToDistribute);
        
        await Sale.findByIdAndUpdate(s._id, {
          $inc: { 
            dueAmount: -paymentForThisSale,
            paidAmount: paymentForThisSale 
          }
        });

        amountToDistribute -= paymentForThisSale;
      }
    }

    // 7. Final Customer Master Update
    const allCustomerSales = await Sale.find({ customer: data.customer });
    const finalTotalDue = allCustomerSales.reduce((sum, s) => sum + s.dueAmount, 0);

    await Customer.findByIdAndUpdate(data.customer, {
      lastPaymentDate: new Date(),
      totalDue: finalTotalDue,
      lastPayment: cashReceived // We usually track actual cash here
    });

    return sale;
  } catch (error) {
    console.error("Error creating sale:", error);
    throw error;
  }
};
export const getSalesService = async () => {
  return await Sale.find().populate("customer").populate("createdBy");
};

export const getSaleByIdService = async (id) => {
  return await Sale.findById(id).populate("customer").populate("products.product").populate("products.latId").populate("createdBy");
};

export const getSaleByCustomerIdService = async (customerId) => {
  console.log("customerId in service:", customerId);
  return await Sale.find({ customer: customerId }).populate("products.product").populate("createdBy");
};
export const updateSaleService = async (saleId, data) => {
  const { customer, products, totalAmount } = data;

  // -----------------------------------------
  // 1. Update Customer due
  // -----------------------------------------
  await Customer.findByIdAndUpdate(
    customer,
    { $inc: { totalDue: -totalAmount } }
  );

  // -----------------------------------------
  // 2. Update Sale total
  // -----------------------------------------
  await Sale.findByIdAndUpdate(
    saleId,
    { $inc: { totalAmount: -totalAmount } }
  );

  // -----------------------------------------
  // 3. Update product stock, Lat stock, and Sale products array
  // -----------------------------------------
  const sale = await Sale.findById(saleId);
  if (!sale) throw new Error("Sale not found");

  for (const p of products) {

    const returnedQty = p.quantity || 0;
    const returnedBag = Number(p.totalBag) || 0;

    // -------- Update Product stock -------
    await Product.findByIdAndUpdate(
      p.product,
      {
        $inc: {
          currentStock: returnedQty,
          currentStock_bag: returnedBag
        }
      }
    );

    // -------- Update Lat -------
    await Lat.findByIdAndUpdate(
      p.latId,
      {
        $inc: {
          pendingQuantity: returnedQty,
          pendingBag: returnedBag
        }
      }
    );

    // -------- Update Sale products array -------
    const index = sale.products.findIndex(
      (item) =>
        item.latId.toString() === p.latId &&
        item.product.toString() === p.product
    );

    if (index !== -1) {
      sale.products[index].quantity = p.originalQty - p.quantity;
      sale.products[index].totalBag = sale.products[index].totalBag - Number(p.totalBag) || 0;
      sale.products[index].totalAmount = sale.products[index].totalAmount - p.totalAmount;

    }
  }

  await sale.save();

  return "Sale and related records updated successfully";
};



export const deleteSaleService = async (id) => {
  return await Sale.findByIdAndDelete(id);
};