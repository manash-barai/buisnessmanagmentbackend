import Purchase from "../models/Purchase.js";

export const createPurchaseService = async (data) => {
  const purchase = new Purchase(data);
  return await purchase.save();
};

export const getPurchasesService = async (page, limit) => {
  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const limitInt = parseInt(limit, 10);

  const purchases = await Purchase.find({})
    .skip(skip)
    .limit(limitInt)
    .sort({ updatedAt: -1 })
    .populate("supplier")
    .populate("products")
    .populate("createdBy");

  const totalPurchases = await Purchase.countDocuments();

  return {
    purchases,
    totalPurchases,
    currentPage: parseInt(page, 10),
    totalPages: Math.ceil(totalPurchases / limitInt),
  };
};

export const getPurchaseByIdService = async (id) => {
  return await Purchase.findById(id).populate("supplier").populate("products.product").populate("createdBy");
};

export const updatePurchaseService = async (id, data) => {
  return await Purchase.findByIdAndUpdate(id, data, { new: true });
};

export const deletePurchaseService = async (id) => {
  return await Purchase.findByIdAndDelete(id);
};