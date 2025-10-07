import ActivityLog from "../models/ActivityLog.js";

export const createActivityLogService = async (data) => {
  const activityLog = new ActivityLog(data);
  return await activityLog.save();
};

export const getActivityLogsService = async () => {
  return await ActivityLog.find().populate("user");
};

export const getActivityLogByIdService = async (id) => {
  return await ActivityLog.findById(id).populate("user");
};