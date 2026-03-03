import {
  createSupplierService,
  getSuppliersService,
  getSupplierByIdService,
  updateSupplierService,
  deleteSupplierService,
} from "../services/supplierService.js";
export const createSupplier = async (req, res) => {
  try {
    const supplier = await createSupplierService(req.body);
    res.status(201).json(supplier);

  } catch (err) {
    res.status(err.statusCode || 500).json({
      message: err.message
    });
  }
};



export const getSuppliers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const suppliers = await getSuppliersService(page, limit);
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getSupplierById = async (req, res) => {
  try {
    const supplier = await getSupplierByIdService(req.params.id);
    if (!supplier) return res.status(404).json({ error: "Supplier not found" });
    res.json(supplier);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateSupplier = async (req, res) => {
  try {
    const supplier = await updateSupplierService(req.params.id, req.body);
    if (!supplier) return res.status(404).json({ error: "Supplier not found" });
    res.json(supplier);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteSupplier = async (req, res) => {
  try {
    const supplier = await deleteSupplierService(req.params.id);
    if (!supplier) return res.status(404).json({ error: "Supplier not found" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};