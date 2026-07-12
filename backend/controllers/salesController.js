export const getSales = async (req, res) => {
  const pool = req.app.locals.pool;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const { itemId, startDate, endDate, sortBy, sortOrder } = req.query;

  const conditions = [];
  const params = [];

  if (itemId) {
    conditions.push('s.itemId = ?');
    params.push(itemId);
  }
  if (startDate) {
    conditions.push('s.salesDate >= ?');
    params.push(startDate);
  }
  if (endDate) {
    conditions.push('s.salesDate <= ?');
    params.push(endDate);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const allowedSortColumns = ['itemName', 'quantity', 'salesPrice', 'salesDate', 'addedBy'];
  let orderByClause = 'ORDER BY s.salesDate DESC, s.id DESC';
  if (sortBy && allowedSortColumns.includes(sortBy)) {
    const direction = sortOrder === 'asc' ? 'ASC' : 'DESC';
    if (sortBy === 'itemName') {
      orderByClause = `ORDER BY i.name ${direction}, s.id DESC`;
    } else if (sortBy === 'addedBy') {
      orderByClause = `ORDER BY u.username ${direction}, s.id DESC`;
    } else {
      orderByClause = `ORDER BY s.${sortBy} ${direction}, s.id DESC`;
    }
  }

  const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM sales s ${whereClause}`, params);
  const total = countRows[0].total;

  const [rows] = await pool.query(
    `SELECT s.id, s.itemId, s.quantity, s.salesPrice, s.salesDate,
            s.salesPrice AS totalAmount,
            i.name AS itemName,
            u.username AS addedBy
      FROM sales s
      LEFT JOIN items i ON s.itemId = i.id
      LEFT JOIN users u ON s.userId = u.id
      ${whereClause}
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

export const createSale = async (req, res) => {
  const pool = req.app.locals.pool;
  const { itemId, quantity = 1, salesPrice = 0.00, salesDate = new Date() } = req.body;

  if (!itemId || !Number(itemId)) {
    return res.status(400).json({ message: 'Item is required' });
  }
  if (!quantity || quantity <= 0) {
    return res.status(400).json({ message: 'Sales quantity must be greater than zero' });
  }

  // Check if item exists and is active
  const [itemRows] = await pool.query('SELECT isActive FROM items WHERE id = ?', [itemId]);
  if (itemRows.length === 0) {
    return res.status(400).json({ message: 'Item not found' });
  }
  if (itemRows[0].isActive !== 1) {
    return res.status(400).json({ message: 'Sale can only be recorded for an active item' });
  }

  // Get opening quantity from items table
  const [openingRows] = await pool.query('SELECT openingQty FROM items WHERE id = ?', [itemId]);
  const openingQty = Number(openingRows[0]?.openingQty || 0);

  // Get total purchased quantity from purchases table
  const [purchaseRows] = await pool.query(
    'SELECT COALESCE(SUM(quantity), 0) AS totalPurchased FROM purchases WHERE itemId = ?',
    [itemId]
  );
  const purchasedQty = Number(purchaseRows[0]?.totalPurchased || 0);

  // Get total sold quantity from sales table
  const [salesRows] = await pool.query(
    'SELECT COALESCE(SUM(quantity), 0) AS totalSold FROM sales WHERE itemId = ?',
    [itemId]
  );
  const soldQty = Number(salesRows[0]?.totalSold || 0);

  // Calculate available quantity
  const available = openingQty + purchasedQty - soldQty;
  if (quantity > available) {
    return res.status(400).json({ message: `Sales quantity cannot exceed available stock (${available})` });
  }

  const userId = req.user ? req.user.id : null;

  const [result] = await pool.query(
    'INSERT INTO sales (itemId, quantity, salesPrice, salesDate, userId) VALUES (?, ?, ?, ?, ?)',
    [itemId, quantity, salesPrice, salesDate, userId]
  );

  res.status(201).json({ id: result.insertId, itemId, quantity, salesPrice, salesDate, userId });
};
