import {
  createSaleService,
  getSalesService,
  getSaleByIdService,
  updateSaleService,
  deleteSaleService,
  getSaleByCustomerIdService
} from "../services/saleService.js";

export const createSale = async (req, res) => {
  try {

    const sale = await createSaleService(req.body);
    res.status(201).json(sale);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getSales = async (req, res) => {
  try {
    const sales = await getSalesService();
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getSaleById = async (req, res) => {
  try {
    const sale = await getSaleByIdService(req.params.id);
    if (!sale) return res.status(404).json({ error: "Sale not found" });
    res.json(sale);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const getSaleByCustomerId = async (req, res) => {
  
  try {
    const sale = await getSaleByCustomerIdService(req.params.customerId);
    if (!sale) return res.status(404).json({ error: "Sale not found" });
    res.json(sale);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateSale = async (req, res) => {
  try {
    const sale = await updateSaleService(req.params.id, req.body);
    if (!sale) return res.status(404).json({ error: "Sale not found" });
    res.json(sale);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteSale = async (req, res) => {
  try {
    const sale = await deleteSaleService(req.params.id);
    if (!sale) return res.status(404).json({ error: "Sale not found" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};