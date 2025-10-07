import {
  createReturnService,
  getReturnsService,
  getReturnByIdService,
  updateReturnService,
  deleteReturnService,
} from "../services/returnService.js";

export const createReturn = async (req, res) => {
  try {
    const newReturn = await createReturnService(req.body);
    res.status(201).json(newReturn);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getReturns = async (req, res) => {
  try {
    const returns = await getReturnsService();
    res.json(returns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getReturnById = async (req, res) => {
  try {
    const singleReturn = await getReturnByIdService(req.params.id);
    if (!singleReturn) return res.status(404).json({ error: "Return not found" });
    res.json(singleReturn);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateReturn = async (req, res) => {
  try {
    const updatedReturn = await updateReturnService(req.params.id, req.body);
    if (!updatedReturn) return res.status(404).json({ error: "Return not found" });
    res.json(updatedReturn);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteReturn = async (req, res) => {
  try {
    const deletedReturn = await deleteReturnService(req.params.id);
    if (!deletedReturn) return res.status(404).json({ error: "Return not found" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};