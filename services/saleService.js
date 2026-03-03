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
export const getSalesService = async (page, limit) => {
  const pageInt = parseInt(page, 10) || 1;
  const limitInt = parseInt(limit, 10) || 10;
  const skip = (pageInt - 1) * limitInt;

  // 1. Fetch paginated sales with populations
  const sales = await Sale.find({})
    .skip(skip)
    .limit(limitInt)
    .sort({ updatedAt: -1 })
    .populate("customer")
    .populate("createdBy")
    .populate({
      path: "products.product",
      select: "name unitCategory"
    });
  // 2. Get the total count for frontend pagination controls
  const totalSales = await Sale.countDocuments({});

  // 3. Return the standard response object
  return {
    sales,
    totalSales,
    currentPage: pageInt,
    totalPages: Math.ceil(totalSales / limitInt),
  };
};

export const getSaleByIdService = async (id) => {
  return await Sale.findById(id).populate("customer").populate("products.product").populate("products.latId").populate("createdBy");
};

export const getSaleByCustomerIdService = async (customerId) => {
  console.log("customerId in service:", customerId);
  return await Sale.find({ customer: customerId })
    .sort({ updatedAt: -1 }).populate("products.product").populate("createdBy");
};
export const updateSaleService = async (saleId, data) => {
  try {
    const { customer, products, totalAmount, previousAmount } = data;

    const returnAmount = previousAmount - totalAmount;

    // -----------------------------------------
    // 1️⃣ Get Sale
    // -----------------------------------------
    const sale = await Sale.findById(saleId);
    if (!sale) throw new Error("Sale not found");

    // Store original values for calculation
    const originalPaidAmount = sale.paidAmount;
    let remainingCredit = 0; // Track unused credit

    // -----------------------------------------
    // 2️⃣ Process Return If Exists
    // -----------------------------------------
    if (returnAmount > 0) {
      
      // Update sale total first
      sale.totalAmount = totalAmount;
      
      // Adjust paid amount if customer overpaid for this sale
      if (sale.paidAmount > totalAmount) {
        // Customer paid more than the new total
        sale.paidAmount = totalAmount;
      }

      // Recalculate due safely
      sale.dueAmount = sale.totalAmount - sale.paidAmount;

      let extraCredit = 0;

      // Calculate extra credit correctly
      if (originalPaidAmount > sale.paidAmount) {
        // Customer had paid more than they should have for this sale now
        extraCredit = originalPaidAmount - sale.paidAmount;
      }

      // If fully returned → mark sale as returned
      if (sale.totalAmount === 0) {
        sale.returnd = true;
      }

      await sale.save();

      // -----------------------------------------
      // 3️⃣ Create Return Payment Entry
      // -----------------------------------------
      await paymentSchema.create({
        customer,
        amount: returnAmount,
        rd: 0,
        method: "CASH",
        notes: `Return from sale ${saleId}`,
        saleId: saleId,
        returned: true,
        paymentType: "RETURN",
        remainingAmount: 0
      });

      // -----------------------------------------
      // 4️⃣ If extra credit exists, adjust other unpaid sales
      // -----------------------------------------
      if (extraCredit > 0) {
        remainingCredit = extraCredit;

        // Find all unpaid sales for this customer (excluding current sale)
        const unpaidSales = await Sale.find({
          customer,
          dueAmount: { $gt: 0 },
          _id: { $ne: saleId }
        }).sort({ saleDate: 1 }); // Oldest first (FIFO approach)

        for (const s of unpaidSales) {
          if (remainingCredit <= 0) break;

          const amountToApply = Math.min(remainingCredit, s.dueAmount);
          
          // Update the sale
          s.paidAmount += amountToApply;
          s.dueAmount -= amountToApply;
          remainingCredit -= amountToApply;

          await s.save();

          // Record this credit adjustment as a payment
          await paymentSchema.create({
            customer,
            amount: amountToApply,
            rd: 0,
            method: "CREDIT",
            notes: `Credit applied from return of sale ${saleId}`,
            saleId: s._id,
            returned: false,
            paymentType: "CREDIT_ADJUSTMENT",
            remainingAmount: s.dueAmount
          });
        }

        // Log remaining credit if any
        if (remainingCredit > 0) {
          console.log(`Customer has ₹${remainingCredit} credit remaining - will show as negative totalDue`);
        }
      }
    }

    // -----------------------------------------
    // 5️⃣ Update Product & Lat Stock (Add back returned items)
    // -----------------------------------------
    for (const p of products) {
      const returnedQty = p.returnedQty || 0;
      const returnedBag = Number(p.totalBag) || 0;

      // Only update stock if items were actually returned
      if (returnedQty > 0) {
        await Product.findByIdAndUpdate(
          p.product,
          {
            $inc: {
              currentStock: returnedQty,
              currentStock_bag: returnedBag
            }
          }
        );

        await Lat.findByIdAndUpdate(
          p.latId,
          {
            $inc: {
              pendingQuantity: returnedQty,
              pendingBag: returnedBag
            }
          }
        );
      }

      // Update the product in sale's products array
      const index = sale.products.findIndex(
        (item) =>
          item.latId.toString() === p.latId &&
          item.product.toString() === p.product
      );

      if (index !== -1) {
        sale.products[index].quantity = p.quantity;
        sale.products[index].totalBag = p.totalBag || 0;
        sale.products[index].totalAmount = p.totalAmount;
        sale.products[index].returnedQuantity =
          (sale.products[index].returnedQuantity || 0) + returnedQty;
      }
    }

    await sale.save();

    // -----------------------------------------
    // 6️⃣ Recalculate Customer Total Due (including unused credit)
    // -----------------------------------------
    const allSales = await Sale.find({ customer });

    // Sum all due amounts from all sales
    let finalTotalDue = allSales.reduce(
      (sum, s) => sum + (s.dueAmount || 0),
      0
    );

    // IMPORTANT: Subtract any unused credit to make totalDue negative if needed
    if (remainingCredit > 0) {
      finalTotalDue = finalTotalDue - remainingCredit;
    }

    // Update customer with final totalDue (can be negative)
    await Customer.findByIdAndUpdate(customer, {
      totalDue: finalTotalDue
    });

    // -----------------------------------------
    // 7️⃣ Return success response
    // -----------------------------------------
    return {
      success: true,
      message: "Sale updated and return processed successfully",
      returnAmount: returnAmount > 0 ? returnAmount : 0,
      extraCredit: remainingCredit,
      customerTotalDue: finalTotalDue, // Will be negative if you owe customer
      customerStatus: finalTotalDue >= 0 ? 
        `Customer owes ₹${finalTotalDue}` : 
        `You owe customer ₹${Math.abs(finalTotalDue)}`,
      updatedSale: sale
    };

  } catch (error) {
    console.error("Error updating sale with return:", error);
    throw error;
  }
};




export const deleteSaleService = async (id) => {
  return await Sale.findByIdAndDelete(id);
};