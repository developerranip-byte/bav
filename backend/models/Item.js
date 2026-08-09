import pool from '../db.js';

export const Item = {
  getPaginatedItems: async ({ whereClause, params, orderByClause, limit, offset }) => {
    const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM items ${whereClause}`, params);
    const total = countRows[0].total;

    const [rows] = await pool.query(
      `SELECT i.id, i.name, i.categoryId, i.languageId, i.isbn, i.openingQty, i.isActive,
              c.name AS categoryName, l.name AS languageName, l.code AS languageCode,
              COALESCE((
                SELECT p.amount
                FROM purchases p
                WHERE p.itemId = i.id
                ORDER BY p.purchaseDate DESC, p.id DESC
                LIMIT 1
              ), 0.00) AS lastPurchasePrice
        FROM items i
        LEFT JOIN categories c ON i.categoryId = c.id
        LEFT JOIN languages l ON i.languageId = l.id
        ${whereClause.replace(/items\./g, 'i.')}
        ${orderByClause}
        LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return { total, rows };
  },

  searchActive: async (likeQuery) => {
    const [rows] = await pool.query(
      `SELECT id, name, isbn, categoryId, languageId, openingQty, isActive
         FROM items
        WHERE isActive = 1 AND (name LIKE ? OR isbn LIKE ?)
        ORDER BY name
        LIMIT 10`,
      [likeQuery, likeQuery]
    );
    return rows;
  },

  findByNameAndIsbn: async (name, isbn, excludeId = null) => {
    let query = 'SELECT id FROM items WHERE name = ? AND (isbn = ? OR (isbn IS NULL AND ? IS NULL))';
    let params = [name, isbn, isbn];
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    const [existing] = await pool.query(query, params);
    return existing;
  },

  create: async ({ name, categoryId, languageId, isbn, openingQty, isActive }) => {
    const [result] = await pool.query(
      'INSERT INTO items (name, categoryId, languageId, isbn, openingQty, isActive) VALUES (?, ?, ?, ?, ?, ?)',
      [name, categoryId, languageId, isbn, openingQty, isActive ? 1 : 0]
    );
    return result.insertId;
  },

  update: async (id, { name, categoryId, languageId, isbn, openingQty, isActive }) => {
    await pool.query(
      'UPDATE items SET name = ?, categoryId = ?, languageId = ?, isbn = ?, openingQty = ?, isActive = ? WHERE id = ?',
      [name, categoryId, languageId, isbn, openingQty, isActive ? 1 : 0, id]
    );
  },

  delete: async (id) => {
    await pool.query('DELETE FROM items WHERE id = ?', [id]);
  },

  bulkDelete: async (ids) => {
    const placeholders = ids.map(() => '?').join(',');
    await pool.query(`DELETE FROM items WHERE id IN (${placeholders})`, ids);
  },

  getAllForExport: async () => {
    const [rows] = await pool.query(
      `SELECT i.id AS 'Item ID', i.name AS 'Name', i.isbn AS 'ISBN', 
              c.name AS 'Category', l.name AS 'Language'
       FROM items i
       LEFT JOIN categories c ON i.categoryId = c.id
       LEFT JOIN languages l ON i.languageId = l.id
       ORDER BY i.id DESC`
    );
    return rows;
  },

  getAllCategories: async (onlyActive = false) => {
    const query = onlyActive ? `SELECT id, name FROM categories WHERE isActive = 1` : `SELECT id, name FROM categories`;
    const [rows] = await pool.query(query);
    return rows;
  },

  getAllLanguages: async (onlyActive = false) => {
    const query = onlyActive ? `SELECT id, name FROM languages WHERE isActive = 1` : `SELECT id, name FROM languages`;
    const [rows] = await pool.query(query);
    return rows;
  },

  importUpdateFull: async (id, name, categoryId, languageId, isbn) => {
    await pool.query(
      'UPDATE items SET name = ?, categoryId = ?, languageId = ?, isbn = ?, openingQty = 0 WHERE id = ?',
      [name, categoryId, languageId, isbn, id]
    );
  },

  importUpdatePartial: async (id, categoryId, languageId) => {
    await pool.query(
      'UPDATE items SET categoryId = ?, languageId = ? WHERE id = ?',
      [categoryId, languageId, id]
    );
  },

  importCreate: async (name, categoryId, languageId, isbn) => {
    await pool.query(
      'INSERT INTO items (name, categoryId, languageId, isbn, openingQty, isActive) VALUES (?, ?, ?, ?, 0, 1)',
      [name, categoryId, languageId, isbn]
    );
  }
};
