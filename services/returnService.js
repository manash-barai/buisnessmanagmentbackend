import Return from "../models/Return.js";

export const createReturnService = async (data) => {
  const newReturn = new Return(data);
  return await newReturn.save();
};

export const getReturnsService = async (page, limit) => {
  const options = {
    skip: (parseInt(page, 10) - 1) * parseInt(limit, 10),
    limit: parseInt(limit, 10),
    sort: { updatedAt: -1 },
  };
  return await Return.find({}, null, options).populate("customer").populate("supplier").populate("products.product").populate("createdBy");
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