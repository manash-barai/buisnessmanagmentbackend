import express from "express";
import {
  createActivityLog,
  getActivityLogs,
  getActivityLogById,
} from "../controllers/controller.activityLog.js";

const router = express.Router();

router.post("/", createActivityLog);
router.get("/", getActivityLogs);
router.get("/:id", getActivityLogById);

export default router;