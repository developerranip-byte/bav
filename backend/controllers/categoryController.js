import { Category } from '../models/Category.js';
export const getCategories = async (req, res) => {
  
  const rows = await Category.findAll();
  res.json(rows);
};

export const createCategory = async (req, res) => {
  
  const { name, description = '', isActive = true } = req.body;
  const insertId = await Category.create({ name, description, isActive });
  res.status(201).json({ id: insertId, name, description, isActive });
};

export const updateCategory = async (req, res) => {
  
  const { id } = req.params;
  const { name, description = '', isActive = true } = req.body;
  await Category.update(id, { name, description, isActive });
  res.json({ id: Number(id), name, description, isActive });
};

export const deleteCategory = async (req, res) => {
  
  const { id } = req.params;
  await Category.delete(id);
  res.status(204).end();
};
