import Lat from "../models/Lat.js";

export const getLatsService = async (filters) => {
  // Destructure with default values
  const { page = 1, limit = 10, id, latNumber, supplier, customer, startDate, endDate } = filters;
  
  const pageInt = parseInt(page, 10);
  const limitInt = parseInt(limit, 10);
  const skip = (pageInt - 1) * limitInt;

  const query = {};

  // 1. Logic: Only show Lats where pendingBag is greater than 0
  query.pendingQuantity = { $gt: 0 };

  // 2. Logic: Find Lats by Product ID (using the 'id' param you mentioned)
  if (id) {
    query.product = id; 
  }

  // 3. Other Filters
  if (latNumber) {
    query.latNumber = { $regex: latNumber, $options: "i" };
  }

  if (supplier) {
    query.supplier = supplier;
  }

  if (customer) {
    query['Customer.customer'] = customer;
  }

  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  // Execute Query with Pagination
  const lats = await Lat.find(query)
    .populate("purchase")
    .populate("supplier")
    .populate("product") // Populate product to see details
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limitInt);

  const totalLats = await Lat.countDocuments(query);

  return {
    lats,
    totalLats,
    currentPage: pageInt,
    totalPages: Math.ceil(totalLats / limitInt),
  };
};

export const getLatByIdService = async (id) => {
  return await Lat.findById(id);
};