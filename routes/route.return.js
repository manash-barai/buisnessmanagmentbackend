import express from "express";
import {
  createReturn,
  getReturns,
  getReturnById,
  updateReturn,
  deleteReturn,
} from "../controllers/controller.return.js";

const router = express.Router();

router.post("/", createReturn);
router.get("/", getReturns);
router.get("/:id", getReturnById);
router.put("/:id", updateReturn);
router.delete("/:id", deleteReturn);

export default router;