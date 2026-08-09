import { Language } from '../models/Language.js';
export const getLanguages = async (req, res) => {
  
  const rows = await Language.findAll();
  res.json(rows);
};

export const createLanguage = async (req, res) => {
  
  const { name, code, isActive = true } = req.body;
  const insertId = await Language.create({ name, code, isActive });
  res.status(201).json({ id: insertId, name, code, isActive });
};

export const updateLanguage = async (req, res) => {
  
  const { id } = req.params;
  const { name, code, isActive = true } = req.body;
  await Language.update(id, { name, code, isActive });
  res.json({ id: Number(id), name, code, isActive });
};

export const deleteLanguage = async (req, res) => {
  
  const { id } = req.params;
  await Language.delete(id);
  res.status(204).end();
};
