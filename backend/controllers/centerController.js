import { Center } from '../models/Center.js';

export const getCenters = async (req, res) => {
  try {
    const rows = await Center.findAll();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createCenter = async (req, res) => {
  try {
    const { name, location, isActive = true } = req.body;
    const insertId = await Center.create({ name, location, isActive });
    res.status(201).json({ id: insertId, name, location, isActive });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateCenter = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, isActive = true } = req.body;
    await Center.update(id, { name, location, isActive });
    res.json({ id: Number(id), name, location, isActive });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteCenter = async (req, res) => {
  try {
    const { id } = req.params;
    await Center.delete(id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
