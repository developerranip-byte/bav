import pool from '../db.js';

export const getCenters = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM centers ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createCenter = async (req, res) => {
  try {
    const { name, location, isActive = true } = req.body;
    const [result] = await pool.query(
      'INSERT INTO centers (name, location, isActive) VALUES (?, ?, ?)',
      [name, location || null, isActive ? 1 : 0]
    );
    res.status(201).json({ id: result.insertId, name, location, isActive });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateCenter = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, isActive = true } = req.body;
    await pool.query(
      'UPDATE centers SET name = ?, location = ?, isActive = ? WHERE id = ?',
      [name, location || null, isActive ? 1 : 0, id]
    );
    res.json({ id: Number(id), name, location, isActive });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteCenter = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM centers WHERE id = ?', [id]);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
