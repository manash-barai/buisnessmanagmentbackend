import {
  createProductService,
  getProductsService,
  getProductByIdService,
  updateProductService,
  deleteProductService,
  adjustStockService
} from "../services/productService.js";

export const createProduct = async (req, res) => {
  try {
    const product = await createProductService(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getProducts = async (req, res) => {
  try {
    const products = await getProductsService();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await getProductByIdService(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await updateProductService(req.params.id, req.body);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json({...product});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {

    const product = await deleteProductService(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json({ message: "Deleted successfully", _id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const adjustStock = async (req, res) => {
  try {
    const { quantityChange } = req.body;
    const product = await adjustStockService(req.params.id, quantityChange);
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
