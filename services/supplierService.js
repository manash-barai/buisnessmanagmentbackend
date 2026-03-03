import Supplier from "../models/Supplier.js";

export const createSupplierService = async (data) => {
  try {
    // trim name to avoid " A " duplicates
    if (data.name) {
      data.name = data.name.trim();
    }

    const supplier = new Supplier(data);
    return await supplier.save();

  } catch (error) {
    // 🔥 Handle duplicate key error
    if (error.code === 11000) {
      throw new Error("Supplier name already exists. Try another name.");
    }

    // Other errors
    throw new Error("Failed to create supplier.");
  }
};


export const getSuppliersService = async (page, limit) => {
  const pageInt = parseInt(page, 10) || 1;
  const limitInt = parseInt(limit, 10) || 10;
  const skip = (pageInt - 1) * limitInt;

  // 1. Fetch paginated suppliers
  // Sorting by updatedAt: -1 ensures newest suppliers appear first
  const suppliers = await Supplier.find({})
    .skip(skip)
    .limit(limitInt)
    .sort({ updatedAt: -1 });

  // 2. Count total suppliers for the pagination UI
  const totalSuppliers = await Supplier.countDocuments({});

  // 3. Return the standard object structure
  return {
    suppliers,
    totalSuppliers,
    currentPage: pageInt,
    totalPages: Math.ceil(totalSuppliers / limitInt),
  };
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