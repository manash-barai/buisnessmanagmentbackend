import {
  createActivityLogService,
  getActivityLogsService,
  getActivityLogByIdService,
} from "../services/activityLogService.js";

export const createActivityLog = async (req, res) => {
  try {
    const activityLog = await createActivityLogService(req.body);
    res.status(201).json(activityLog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const activityLogs = await getActivityLogsService(page, limit);
    res.json(activityLogs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getActivityLogById = async (req, res) => {
  try {
    const activityLog = await getActivityLogByIdService(req.params.id);
    if (!activityLog) return res.status(404).json({ error: "Activity log not found" });
    res.json(activityLog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};