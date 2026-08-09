import pool from '../db.js';

export const Report = {
  getItemReports: async ({ whereClause, params, orderByClause, centerFilterP, centerFilterS, limit, offset }) => {
    const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM items ${whereClause}`, params);
    const total = countRows[0].total;

    const [rows] = await pool.query(
      `SELECT i.id,
              i.name,
              i.openingQty,
              c.name AS categoryName,
              l.name AS languageName,
              COALESCE(p.totalPurchased, 0) AS totalPurchased,
              COALESCE(s.totalSold, 0) AS totalSold,
              COALESCE(p.lastPurchaseDate, NULL) AS lastPurchaseDate,
              COALESCE(s.lastSalesDate, NULL) AS lastSalesDate,
              (i.openingQty + COALESCE(p.totalPurchased, 0) - COALESCE(s.totalSold, 0)) AS currentQuantity
        FROM items i
        LEFT JOIN categories c ON i.categoryId = c.id
        LEFT JOIN languages l ON i.languageId = l.id
        LEFT JOIN (
          SELECT itemId, SUM(quantity) AS totalPurchased, MAX(purchaseDate) AS lastPurchaseDate
          FROM purchases
          ${centerFilterP}
          GROUP BY itemId
        ) p ON p.itemId = i.id
        LEFT JOIN (
          SELECT itemId, SUM(quantity) AS totalSold, MAX(salesDate) AS lastSalesDate
          FROM sales
          ${centerFilterS}
          GROUP BY itemId
        ) s ON s.itemId = i.id
        ${whereClause.replace(/items\./g, 'i.')}
        ${orderByClause}
        LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return { total, rows };
  },

  getItemPurchaseHistory: async ({ whereSql, qParams, limit, offset }) => {
    const [[countRow]] = await pool.query(`SELECT COUNT(*) AS total FROM purchases WHERE ${whereSql}`, qParams);
    const totalCount = Number(countRow.total || 0);

    const selectWhereSql = whereSql
      .replace(/itemId = \?/, 'itemId = ?')
      .replace(/centerId IN \([^)]+\)/, 'centerId IN (' + (qParams.slice(1).map(() => '?').join(',')) + ')');

    const [rows] = await pool.query(
      `SELECT p.id, p.quantity, p.amount, (p.quantity * p.amount) AS totalAmount, p.purchaseDate, p.createdAt, u.username AS addedBy, ctr.name AS centerName
       FROM purchases p 
       LEFT JOIN users u ON p.userId = u.id 
       LEFT JOIN centers ctr ON p.centerId = ctr.id
       WHERE p.${selectWhereSql} 
       ORDER BY p.purchaseDate DESC, p.id DESC LIMIT ? OFFSET ?`,
      [...qParams, limit, offset]
    );

    return { totalCount, rows };
  },

  getItemSalesHistory: async ({ whereSql, qParams, limit, offset }) => {
    const [[countRow]] = await pool.query(`SELECT COUNT(*) AS total FROM sales WHERE ${whereSql}`, qParams);
    const totalCount = Number(countRow.total || 0);

    const selectWhereSql = whereSql
      .replace(/itemId = \?/, 'itemId = ?')
      .replace(/centerId IN \([^)]+\)/, 'centerId IN (' + (qParams.slice(1).map(() => '?').join(',')) + ')');

    const [rows] = await pool.query(
      `SELECT s.id, s.quantity, s.salesPrice, s.salesPrice AS totalAmount, s.salesDate, s.createdAt, u.username AS addedBy, ctr.name AS centerName 
       FROM sales s 
       LEFT JOIN users u ON s.userId = u.id 
       LEFT JOIN centers ctr ON s.centerId = ctr.id
       WHERE s.${selectWhereSql} 
       ORDER BY s.salesDate DESC, s.id DESC LIMIT ? OFFSET ?`,
      [...qParams, limit, offset]
    );

    return { totalCount, rows };
  }
};
