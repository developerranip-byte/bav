import pool from '../db.js';

export const User = {
  findByUsernameActive: async (username) => {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ? AND isActive = 1', [username]);
    return rows[0];
  },
  
  findAll: async () => {
    const [rows] = await pool.query('SELECT id, username, userType, isActive, modules, centers, createdAt FROM users ORDER BY createdAt DESC');
    return rows;
  },

  findById: async (id) => {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
  },

  create: async ({ username, hashedPassword, userType, modulesJson, centersJson }) => {
    const [result] = await pool.query(
      'INSERT INTO users (username, password, userType, modules, centers) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, userType, modulesJson, centersJson]
    );
    return result.insertId;
  },

  update: async (id, querySet, params) => {
    const query = `UPDATE users SET ${querySet} WHERE id = ?`;
    await pool.query(query, [...params, id]);
  }
};
