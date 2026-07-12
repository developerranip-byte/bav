export const getItemReports = async (req, res) => {
  const pool = req.app.locals.pool;
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
        GROUP BY itemId
      ) p ON p.itemId = i.id
      LEFT JOIN (
        SELECT itemId, SUM(quantity) AS totalSold, MAX(salesDate) AS lastSalesDate
        FROM sales
        GROUP BY itemId
      ) s ON s.itemId = i.id
      ORDER BY i.id DESC`
  );
  res.json(rows);
};

export const getItemPurchaseHistory = async (req, res) => {
  const pool = req.app.locals.pool;
  const { id } = req.params;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = 10;
  const offset = (page - 1) * limit;

  const [[countRow]] = await pool.query('SELECT COUNT(*) AS total FROM purchases WHERE itemId = ?', [id]);
  const totalCount = Number(countRow.total || 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  const [rows] = await pool.query(
    'SELECT id, quantity, amount, purchaseDate, createdAt FROM purchases WHERE itemId = ? ORDER BY purchaseDate DESC, id DESC LIMIT ? OFFSET ?',
    [id, limit, offset]
  );

  res.json({ rows, page, totalPages, totalCount });
};

export const getItemSalesHistory = async (req, res) => {
  const pool = req.app.locals.pool;
  const { id } = req.params;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = 10;
  const offset = (page - 1) * limit;

  const [[countRow]] = await pool.query('SELECT COUNT(*) AS total FROM sales WHERE itemId = ?', [id]);
  const totalCount = Number(countRow.total || 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  const [rows] = await pool.query(
    'SELECT id, quantity, salesPrice, salesDate, createdAt FROM sales WHERE itemId = ? ORDER BY salesDate DESC, id DESC LIMIT ? OFFSET ?',
    [id, limit, offset]
  );

  res.json({ rows, page, totalPages, totalCount });
};
