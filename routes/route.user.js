import express from "express";
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  loginUser,
  CustomareSaleDetailse,
  createPayment,
} from "../controllers/controller.user.js";

const router = express.Router();

router.post("/", createUser);
router.get("/", getUsers);
// router.get("/payment/:id", getUsers);
router.get("/saledetailse/:customerId", CustomareSaleDetailse);
router.post("/salePayment", createPayment);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.post("/login", loginUser);

export default router;