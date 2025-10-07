import Product from "../models/Product.js";

export const createProductService = async (data) => {
  const product = new Product(data);
  return await product.save();
};

export const getProductsService = async () => {
  return await Product.find()
};

export const getProductByIdService = async (id) => {
  return await Product.findById(id).populate("Purchase");
};

export const updateProductService = async (id, data) => {
  return await Product.findByIdAndUpdate(id, data, { new: true });
};

export const deleteProductService = async (id) => {
  return await Product.findByIdAndDelete(id);
};

export const adjustStockService = async (id, quantityChange) => {
  const product = await Product.findById(id);
  if (!product) throw new Error("Product not found");
  product.currentStock += quantityChange;
  return await product.save();
};