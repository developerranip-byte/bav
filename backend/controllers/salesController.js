export const getSales = async (req, res) => {
  const pool = req.app.locals.pool;
  const [rows] = await pool.query(
    `SELECT s.id, s.itemId, s.quantity, s.amount, s.salesDate, s.customerName, s.customerPhone,
            i.name AS itemName
      FROM sales s
      LEFT JOIN items i ON s.itemId = i.id
      ORDER BY s.salesDate DESC, s.id DESC`
  );
  res.json(rows);
};

export const createSale = async (req, res) => {
  const pool = req.app.locals.pool;
  const { itemId, quantity = 1, amount, salesDate = new Date(), customerName, customerPhone } = req.body;

  if (!itemId || !Number(itemId)) {
    return res.status(400).json({ message: 'Item is required' });
  }
  if (!quantity || quantity <= 0) {
    return res.status(400).json({ message: 'Sales quantity must be greater than zero' });
  }
  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'Sales amount must be greater than zero' });
  }
  if (!customerName || !customerName.trim()) {
    return res.status(400).json({ message: 'Customer name is required' });
  }
  if (!customerPhone || !customerPhone.trim()) {
    return res.status(400).json({ message: 'Customer phone number is required' });
  }

  const [itemRows] = await pool.query('SELECT isActive FROM items WHERE id = ?', [itemId]);
  if (itemRows.length === 0) {
    return res.status(400).json({ message: 'Item not found' });
  }
  if (itemRows[0].isActive !== 1) {
    return res.status(400).json({ message: 'Sale can only be recorded for an active item' });
  }

  const [stockRows] = await pool.query(
    `SELECT i.openingQty,
            COALESCE(SUM(p.quantity), 0) AS purchasedQty,
            COALESCE(SUM(s.quantity), 0) AS soldQty
       FROM items i
       LEFT JOIN purchases p ON p.itemId = i.id
       LEFT JOIN sales s ON s.itemId = i.id
      WHERE i.id = ?
      GROUP BY i.id`,
    [itemId]
  );

  if (stockRows.length === 0) {
    return res.status(400).json({ message: 'Item not found' });
  }

  const { openingQty, purchasedQty, soldQty } = stockRows[0];
  const available = Number(openingQty || 0) + Number(purchasedQty || 0) - Number(soldQty || 0);
  if (quantity > available) {
    return res.status(400).json({ message: `Sales quantity cannot exceed available stock (${available})` });
  }

  const [result] = await pool.query(
    'INSERT INTO sales (itemId, quantity, amount, salesDate, customerName, customerPhone) VALUES (?, ?, ?, ?, ?, ?)',
    [itemId, quantity, amount, salesDate, customerName, customerPhone]
  );

  res.status(201).json({ id: result.insertId, itemId, quantity, amount, salesDate, customerName, customerPhone });
};
