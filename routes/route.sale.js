import express from "express";
import {
  createSale,
  getSales,
  getSaleById,
  updateSale,
  deleteSale,
  getSaleByCustomerId
} from "../controllers/controller.sale.js";

const router = express.Router();

router.post("/", createSale);
router.get("/", getSales);
router.get("/:id", getSaleById);
router.put("/:id", updateSale);
router.delete("/:id", deleteSale);
router.get("/customerSaleList/:customerId", getSaleByCustomerId);

export default router;