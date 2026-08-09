import pool from '../db.js';

export const Sale = {
  getPaginatedSales: async ({ whereClause, params, orderByClause, limit, offset }) => {
    const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM sales s ${whereClause}`, params);
    const total = countRows[0].total;

    const [rows] = await pool.query(
      `SELECT s.id, s.itemId, s.quantity, s.salesPrice, s.salesDate,
              s.salesPrice AS totalAmount,
              i.name AS itemName,
              u.username AS addedBy, ctr.name AS centerName, s.centerId
        FROM sales s
        LEFT JOIN items i ON s.itemId = i.id
        LEFT JOIN users u ON s.userId = u.id
        LEFT JOIN centers ctr ON s.centerId = ctr.id
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

  getOpeningQty: async (itemId) => {
    const [openingRows] = await pool.query('SELECT openingQty FROM items WHERE id = ?', [itemId]);
    return Number(openingRows[0]?.openingQty || 0);
  },

  getPurchasedQty: async (itemId, centerId) => {
    let query = 'SELECT COALESCE(SUM(quantity), 0) AS totalPurchased FROM purchases WHERE itemId = ?';
    const params = [itemId];
    if (centerId) {
      query += ' AND centerId = ?';
      params.push(centerId);
    }
    const [purchaseRows] = await pool.query(query, params);
    return Number(purchaseRows[0]?.totalPurchased || 0);
  },

  getSoldQty: async (itemId, centerId) => {
    let query = 'SELECT COALESCE(SUM(quantity), 0) AS totalSold FROM sales WHERE itemId = ?';
    const params = [itemId];
    if (centerId) {
      query += ' AND centerId = ?';
      params.push(centerId);
    }
    const [salesRows] = await pool.query(query, params);
    return Number(salesRows[0]?.totalSold || 0);
  },

  getOldSaleQty: async (saleId) => {
    const [oldSaleRows] = await pool.query('SELECT quantity FROM sales WHERE id = ?', [saleId]);
    return oldSaleRows.length > 0 ? Number(oldSaleRows[0].quantity) : 0;
  },

  create: async ({ itemId, quantity, salesPrice, salesDate, userId, centerId }) => {
    const [result] = await pool.query(
      'INSERT INTO sales (itemId, quantity, salesPrice, salesDate, userId, centerId) VALUES (?, ?, ?, ?, ?, ?)',
      [itemId, quantity, salesPrice, salesDate, userId, centerId]
    );
    return result.insertId;
  },

  getAllItemsWithStock: async () => {
    const [items] = await pool.query(`
      SELECT i.id, i.name, 
        (i.openingQty 
         + COALESCE((SELECT SUM(quantity) FROM purchases WHERE itemId = i.id), 0) 
         - COALESCE((SELECT SUM(quantity) FROM sales WHERE itemId = i.id), 0)) AS availableQty
      FROM items i 
      WHERE i.isActive = 1
    `);
    return items;
  },

  getAllForExport: async () => {
    const [rows] = await pool.query(
      `SELECT s.id AS 'Sale ID', s.salesDate AS 'Date', s.itemId AS 'Item ID', 
              i.name AS 'Item Name', s.quantity AS 'Quantity', s.salesPrice AS 'Price',
              ctr.name AS 'Center Name',
              u.username AS 'Added By'
       FROM sales s
       LEFT JOIN items i ON s.itemId = i.id
       LEFT JOIN centers ctr ON s.centerId = ctr.id
       LEFT JOIN users u ON s.userId = u.id
       ORDER BY s.salesDate DESC, s.id DESC`
    );
    return rows;
  },

  getAllItems: async () => {
    const [items] = await pool.query(`SELECT id, name FROM items`);
    return items;
  },

  importUpdate: async (itemId, quantity, salesPrice, salesDate, userId, saleId) => {
    await pool.query(
      'UPDATE sales SET itemId = ?, quantity = ?, salesPrice = ?, salesDate = ?, userId = ? WHERE id = ?',
      [itemId, quantity, salesPrice, salesDate, userId, saleId]
    );
  },

  importCreate: async (itemId, quantity, salesPrice, salesDate, userId) => {
    await pool.query(
      'INSERT INTO sales (itemId, quantity, salesPrice, salesDate, userId) VALUES (?, ?, ?, ?, ?)',
      [itemId, quantity, salesPrice, salesDate, userId]
    );
  }
};
