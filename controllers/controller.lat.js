import { getLatsService, getLatByIdService } from "../services/latService.js";

export const getLats = async (req, res) => {
  try {
    const filters = req.body;
    const lats = await getLatsService(filters);
    res.json(lats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getLatById = async (req, res) => {
  try {
    const lat = await getLatByIdService(req.params.id);
    if (!lat) return res.status(404).json({ error: "Lat not found" });
    res.json(lat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};