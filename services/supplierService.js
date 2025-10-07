import Supplier from "../models/Supplier.js";

export const createSupplierService = async (data) => {
  const supplier = new Supplier(data);
  return await supplier.save();
};

export const getSuppliersService = async () => {
  return await Supplier.find();
};

export const getSupplierByIdService = async (id) => {
  return await Supplier.findById(id);
};

export const updateSupplierService = async (id, data) => {
  return await Supplier.findByIdAndUpdate(id, data, { new: true });
};

export const deleteSupplierService = async (id) => {
  return await Supplier.findByIdAndDelete(id);
};