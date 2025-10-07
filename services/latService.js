import Lat from "../models/Lat.js";

export const getLatsService = async (filters) => {
  const { page = 1, limit = 10, ...filterParams } = filters;
  const query = {};

  if (filterParams.latNumber) {
    query.latNumber = { $regex: filterParams.latNumber, $options: "i" };
  }

  if (filterParams.supplier) {
    query.supplier = filterParams.supplier;
  }

  if (filterParams.customer) {
    query['Customer.customer'] = filterParams.customer;
  }
  ;
  if (filterParams.product) {
    query.product = filterParams.product;
  }

  if (filterParams.startDate && filterParams.endDate) {
    query.createdAt = {
      $gte: new Date(filterParams.startDate),
      $lte: new Date(filterParams.endDate),
    };
  }

  if (filterParams.pendingQuantity === 0) {
    query.pendingQuantity = 0;
  } else if (filterParams.pendingQuantity_ne) {
    query.pendingQuantity = { $ne: 0 };
  }


  return await Lat.find(query).populate(["purchase", "supplier"])
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec();
};

export const getLatByIdService = async (id) => {
  return await Lat.findById(id);
};