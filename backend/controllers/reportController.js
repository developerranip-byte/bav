import pool from '../db.js';
export const getItemReports = async (req, res) => {
  
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const { categoryId, languageId, search, sortBy, sortOrder } = req.query;

  const conditions = [];
  const params = [];

  if (categoryId) {
    conditions.push('items.categoryId = ?');
    params.push(categoryId);
  }
  if (languageId) {
    conditions.push('items.languageId = ?');
    params.push(languageId);
  }
  if (search && search.trim() !== '') {
    const like = `%${search.trim()}%`;
    conditions.push('items.name LIKE ?');
    params.push(like);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const allowedSortColumns = [
    'name', 'categoryName', 'languageName', 'openingQty', 
    'totalPurchased', 'totalSold', 'currentQuantity', 
    'lastPurchaseDate', 'lastSalesDate'
  ];
  
  let orderByClause = 'ORDER BY i.id DESC';
  if (sortBy && allowedSortColumns.includes(sortBy)) {
    const direction = sortOrder === 'asc' ? 'ASC' : 'DESC';
    if (sortBy === 'name' || sortBy === 'openingQty') {
      orderByClause = `ORDER BY i.${sortBy} ${direction}, i.id DESC`;
    } else if (sortBy === 'categoryName') {
      orderByClause = `ORDER BY c.name ${direction}, i.id DESC`;
    } else if (sortBy === 'languageName') {
      orderByClause = `ORDER BY l.name ${direction}, i.id DESC`;
    } else {
      // These are calculated or aliased columns in the SELECT clause.
      // We can just use the alias name directly in ORDER BY.
      orderByClause = `ORDER BY ${sortBy} ${direction}, i.id DESC`;
    }
  }

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
        GROUP BY itemId
      ) p ON p.itemId = i.id
      LEFT JOIN (
        SELECT itemId, SUM(quantity) AS totalSold, MAX(salesDate) AS lastSalesDate
        FROM sales
        GROUP BY itemId
      ) s ON s.itemId = i.id
      ${whereClause.replace(/items\./g, 'i.')}
      ${orderByClause}
      LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  
  res.json({
    data: rows,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  });
};

export const getItemPurchaseHistory = async (req, res) => {
  
  const { id } = req.params;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = 10;
  const offset = (page - 1) * limit;

  const [[countRow]] = await pool.query('SELECT COUNT(*) AS total FROM purchases WHERE itemId = ?', [id]);
  const totalCount = Number(countRow.total || 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  const [rows] = await pool.query(
    `SELECT p.id, p.quantity, p.amount, (p.quantity * p.amount) AS totalAmount, p.purchaseDate, p.createdAt, u.username AS addedBy 
     FROM purchases p 
     LEFT JOIN users u ON p.userId = u.id 
     WHERE p.itemId = ? 
     ORDER BY p.purchaseDate DESC, p.id DESC LIMIT ? OFFSET ?`,
    [id, limit, offset]
  );

  res.json({ rows, page, totalPages, totalCount });
};

export const getItemSalesHistory = async (req, res) => {
  
  const { id } = req.params;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = 10;
  const offset = (page - 1) * limit;

  const [[countRow]] = await pool.query('SELECT COUNT(*) AS total FROM sales WHERE itemId = ?', [id]);
  const totalCount = Number(countRow.total || 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  const [rows] = await pool.query(
    `SELECT s.id, s.quantity, s.salesPrice, s.salesPrice AS totalAmount, s.salesDate, s.createdAt, u.username AS addedBy 
     FROM sales s 
     LEFT JOIN users u ON s.userId = u.id 
     WHERE s.itemId = ? 
     ORDER BY s.salesDate DESC, s.id DESC LIMIT ? OFFSET ?`,
    [id, limit, offset]
  );

  res.json({ rows, page, totalPages, totalCount });
};
