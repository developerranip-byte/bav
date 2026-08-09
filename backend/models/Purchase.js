import pool from '../db.js';

export const Purchase = {
  getPaginatedPurchases: async ({ whereClause, params, orderByClause, limit, offset }) => {
    const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM purchases p ${whereClause}`, params);
    const total = countRows[0].total;

    const [rows] = await pool.query(
      `SELECT p.id, p.purchaseDate, p.itemId, p.quantity, p.amount,
              (p.quantity * p.amount) AS totalAmount,
              i.name AS itemName, c.name AS categoryName, l.name AS languageName,
              u.username AS addedBy, ctr.name AS centerName, p.centerId
        FROM purchases p
        LEFT JOIN items i ON p.itemId = i.id
        LEFT JOIN categories c ON i.categoryId = c.id
        LEFT JOIN languages l ON i.languageId = l.id
        LEFT JOIN users u ON p.userId = u.id
        LEFT JOIN centers ctr ON p.centerId = ctr.id
        ${whereClause}
        ${orderByClause}
        LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return { total, rows };
  },

  checkItemActive: async (itemId) => {
    const [itemRows] = await pool.query('SELECT isActive FROM items WHERE id = ?', [itemId]);
    return itemRows;
  },

  create: async ({ itemId, quantity, amount, purchaseDate, userId, centerId }) => {
    const [result] = await pool.query(
      'INSERT INTO purchases (itemId, quantity, amount, purchaseDate, userId, centerId) VALUES (?, ?, ?, ?, ?, ?)',
      [itemId, quantity, amount, purchaseDate, userId, centerId]
    );
    return result.insertId;
  },

  getAllItems: async (onlyActive = false) => {
    const query = onlyActive ? `SELECT id, name FROM items WHERE isActive = 1` : `SELECT id, name FROM items`;
    const [rows] = await pool.query(query);
    return rows;
  },

  getAllForExport: async () => {
    const [rows] = await pool.query(
      `SELECT p.id AS 'Stock ID', p.purchaseDate AS 'Date', p.itemId AS 'Item ID', 
              i.name AS 'Item Name', p.quantity AS 'Quantity', p.amount AS 'Price',
              (p.quantity * p.amount) AS 'Total Amount',
              ctr.name AS 'Center Name',
              u.username AS 'Added By'
       FROM purchases p
       LEFT JOIN items i ON p.itemId = i.id
       LEFT JOIN centers ctr ON p.centerId = ctr.id
       LEFT JOIN users u ON p.userId = u.id
       ORDER BY p.purchaseDate DESC, p.id DESC`
    );
    return rows;
  },

  importUpdate: async (itemId, quantity, amount, purchaseDate, userId, stockId) => {
    await pool.query(
      'UPDATE purchases SET itemId = ?, quantity = ?, amount = ?, purchaseDate = ?, userId = ? WHERE id = ?',
      [itemId, quantity, amount, purchaseDate, userId, stockId]
    );
  },

  importCreate: async (itemId, quantity, amount, purchaseDate, userId) => {
    await pool.query(
      'INSERT INTO purchases (itemId, quantity, amount, purchaseDate, userId) VALUES (?, ?, ?, ?, ?)',
      [itemId, quantity, amount, purchaseDate, userId]
    );
  }
};
