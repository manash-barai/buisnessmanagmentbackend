import express from "express";
import {
  getLats,
  getLatById,
} from "../controllers/controller.lat.js";

const router = express.Router();

router.post("/", getLats);
router.get("/:id", getLatById);

export default router;