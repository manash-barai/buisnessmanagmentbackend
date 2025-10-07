import Purchase from "../models/Purchase.js";

export const createPurchaseService = async (data) => {
  const purchase = new Purchase(data);
  return await purchase.save();
};

export const getPurchasesService = async () => {
  return await Purchase.find().populate("supplier").populate("products").populate("createdBy");
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