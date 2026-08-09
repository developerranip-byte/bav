import pool from '../db.js';

export const Category = {
  findAll: async () => {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY id DESC');
    return rows;
  },

  create: async ({ name, description, isActive }) => {
    const [result] = await pool.query(
      'INSERT INTO categories (name, description, isActive) VALUES (?, ?, ?)',
      [name, description, isActive ? 1 : 0]
    );
    return result.insertId;
  },

  update: async (id, { name, description, isActive }) => {
    await pool.query(
      'UPDATE categories SET name = ?, description = ?, isActive = ? WHERE id = ?',
      [name, description, isActive ? 1 : 0, id]
    );
  },

  delete: async (id) => {
    await pool.query('DELETE FROM categories WHERE id = ?', [id]);
  }
};
