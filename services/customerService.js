import Customer from "../models/Customer.js";

export const createCustomerService = async (data) => {
  const customer = new Customer(data);
  return await customer.save();
};

export const getCustomersService = async (page, limit) => {
  const pageInt = parseInt(page, 10) || 1;
  const limitInt = parseInt(limit, 10) || 10;
  const skip = (pageInt - 1) * limitInt;

  // 1. Fetch paginated customers
  const customers = await Customer.find({})
    .skip(skip)
    .limit(limitInt)
    .sort({ name: 1 }); // Usually best to sort customers alphabetically

  // 2. Count total for the pagination UI
  const totalCustomers = await Customer.countDocuments({});

  // 3. Return the standard object structure
  return {
    customers,
    totalCustomers,
    currentPage: pageInt,
    totalPages: Math.ceil(totalCustomers / limitInt),
  };
};

export const getCustomerByIdService = async (id) => {
  return await Customer.findById(id);
};

export const updateCustomerService = async (id, data) => {
  return await Customer.findByIdAndUpdate(id, data, { new: true });
};

export const deleteCustomerService = async (id) => {
  return await Customer.findByIdAndDelete(id);
};