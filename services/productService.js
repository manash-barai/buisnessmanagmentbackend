import Product from "../models/Product.js";

export const createProductService = async (data) => {
  const product = new Product(data);
  return await product.save();
};

export const getProductsService = async (page, limit) => {
  const pageInt = parseInt(page, 10) || 1;
  const limitInt = parseInt(limit, 10) || 10;
  const skip = (pageInt - 1) * limitInt;

  // 1. Fetch the paginated data
  const products = await Product.find({})
    .skip(skip)
    .limit(limitInt)
    .sort({ updatedAt: -1 });
    // Add .populate() here if Product has references

  // 2. Get the total count for pagination math
  const totalProducts = await Product.countDocuments();

  // 3. Return the structured object
  return {
    products,
    totalProducts,
    currentPage: pageInt,
    totalPages: Math.ceil(totalProducts / limitInt),
  };
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