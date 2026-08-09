import pool from '../db.js';

export const Center = {
  findAll: async () => {
    const [rows] = await pool.query('SELECT * FROM centers ORDER BY id DESC');
    return rows;
  },

  create: async ({ name, location, isActive }) => {
    const [result] = await pool.query(
      'INSERT INTO centers (name, location, isActive) VALUES (?, ?, ?)',
      [name, location || null, isActive ? 1 : 0]
    );
    return result.insertId;
  },

  update: async (id, { name, location, isActive }) => {
    await pool.query(
      'UPDATE centers SET name = ?, location = ?, isActive = ? WHERE id = ?',
      [name, location || null, isActive ? 1 : 0, id]
    );
  },

  delete: async (id) => {
    await pool.query('DELETE FROM centers WHERE id = ?', [id]);
  }
};
