import Sale from "../models/Sale.js";
import Product from "../models/Product.js";
import Customer from "../models/Customer.js";
import Lat from "../models/Lat.js";

// services/saleService.js
export const createSaleService = async (data) => {

  try {
    // 1. Create the Sale object with proper Date handling

    const saleData = {
      ...data,
      Date: data.Date ? new Date(data.Date) : new Date(), // Ensure proper Date object
      products: data.products.map(product => {
        const unitPrice = product.Price_PerUnit || product.unitPrice || 0;
        const totalAmount = unitPrice * product.quantity;
        const totalBags = product.totalBags || 0;
        return {
          product: product.product,
          quantity: product.quantity,
          totalBag: totalBags,
          unitPrice: unitPrice,
          totalAmount: totalAmount, // Add this required field
          paidAmountOnline: product.paidAmountOnline || 0,
          paidAmountOffline: product.paidAmountOffline || 0,
          dueAmount: Number(product.SaleDue),
          notes: data.notes || "",
          latId: product.lot // map lot -> latId
        };
      })
    };


    // 2. Verify Customer
    const customer = await Customer.findById(data.customer);
    if (!customer) {
      throw new Error(`Customer not found with id: ${data.customer}`);
    }

    // 3. Process each product
    for (const item of data.products) {
      console.log("Processing product:", item);
      // Update Product stock
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { currentStock: -item.quantity } },
        { $inc: { currentStock_bag: -item.totalBags } }
      );

      // Update Lat (lot)
      const lat = await Lat.findById(item.lot);

      if (!lat) {
        throw new Error(`Lat not found with id: ${item.lot}`);
      }

      if ((lat.pendingQuantity || 0) < item.quantity) {
        throw new Error(`Insufficient quantity in Lat ${lat.latNumber}`);
      }
    }

    // 4. Create and save sale
    const sale = new Sale(saleData);
    await sale.save();

    // 5. Update Lat records after sale is created
    for (const item of data.products) {
      await Lat.findByIdAndUpdate(
        item.lot,
        {
          $inc: {
            pendingQuantity: -item.quantity,
            pendingBag: -(item.totalBags || 0)
          },
          $push: {
            Customer: {
              customer: data.customer,
              quantity: item.quantity,
              pricePerUnit: item.unitPrice || item.Price_PerUnit || 0,
              sellingBags: item.totalBags || 0,
              sellingQuantity: item.quantity,
              saleId: sale._id
            }
          }
        }
      );
    }

    // 6. Payment calculations
    const totalPaidOnline = sale.products.reduce(
      (sum, item) => sum + (item.paidAmountOnline || 0), 0
    );
    const totalPaidOffline = sale.products.reduce(
      (sum, item) => sum + (item.paidAmountOffline || 0), 0
    );
    const totalPaid = totalPaidOnline + totalPaidOffline;



    // 7. Update Customer info
    const updateCustomer = {
      lastPaymentDate: new Date(),
      totalDue: data?.totalDue,
      lastPayment: totalPaid

    };

    if (totalPaidOffline > 0) {
      updateCustomer.lastShop = totalPaidOffline;
    }

    await Customer.findByIdAndUpdate(
      data.customer,
      updateCustomer
    );

    return sale;
  } catch (error) {
    console.error("Error creating sale:", error);
    throw error; // Re-throw to handle in the controller
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

    const returnedQty = p.returnedQty || 0;
    const returnedBag = p.totalBag || 0;

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
      sale.products[index].quantity = p.originalQty - p.returnedQty;
      sale.products[index].totalBag = sale.products[index].totalBag - p.totalBag;
      sale.products[index].totalAmount = sale.products[index].totalAmount - p.totalAmount;

    }
  }

  await sale.save();

  return "Sale and related records updated successfully";
};



export const deleteSaleService = async (id) => {
  return await Sale.findByIdAndDelete(id);
};