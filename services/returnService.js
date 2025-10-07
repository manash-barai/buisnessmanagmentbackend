import Return from "../models/Return.js";

export const createReturnService = async (data) => {
  const newReturn = new Return(data);
  return await newReturn.save();
};

export const getReturnsService = async () => {
  return await Return.find().populate("customer").populate("supplier").populate("products.product").populate("createdBy");
};

export const getReturnByIdService = async (id) => {
  return await Return.findById(id).populate("customer").populate("supplier").populate("products.product").populate("createdBy");
};

export const updateReturnService = async (id, data) => {
  return await Return.findByIdAndUpdate(id, data, { new: true });
};

export const deleteReturnService = async (id) => {
  return await Return.findByIdAndDelete(id);
};