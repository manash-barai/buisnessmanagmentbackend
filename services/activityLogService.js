import ActivityLog from "../models/ActivityLog.js";

export const createActivityLogService = async (data) => {
  const activityLog = new ActivityLog(data);
  return await activityLog.save();
};

export const getActivityLogsService = async (page, limit) => {
  const options = {
    skip: (parseInt(page, 10) - 1) * parseInt(limit, 10),
    limit: parseInt(limit, 10),
    sort: { updatedAt: -1 },
  };
  return await ActivityLog.find({}, null, options).populate("user");
};

export const getActivityLogByIdService = async (id) => {
  return await ActivityLog.findById(id).populate("user");
};