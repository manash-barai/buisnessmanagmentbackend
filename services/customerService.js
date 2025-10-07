import Customer from "../models/Customer.js";

export const createCustomerService = async (data) => {
  const customer = new Customer(data);
  return await customer.save();
};

export const getCustomersService = async () => {
  return await Customer.find();
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