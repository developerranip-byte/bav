import pool from '../db.js';

export const Language = {
  findAll: async () => {
    const [rows] = await pool.query('SELECT * FROM languages ORDER BY id DESC');
    return rows;
  },

  create: async ({ name, code, isActive }) => {
    const [result] = await pool.query(
      'INSERT INTO languages (name, code, isActive) VALUES (?, ?, ?)',
      [name, code, isActive ? 1 : 0]
    );
    return result.insertId;
  },

  update: async (id, { name, code, isActive }) => {
    await pool.query(
      'UPDATE languages SET name = ?, code = ?, isActive = ? WHERE id = ?',
      [name, code, isActive ? 1 : 0, id]
    );
  },

  delete: async (id) => {
    await pool.query('DELETE FROM languages WHERE id = ?', [id]);
  }
};
