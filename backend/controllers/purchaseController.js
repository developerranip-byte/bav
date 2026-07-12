export const getPurchases = async (req, res) => {
  const pool = req.app.locals.pool;
  const [rows] = await pool.query(
    `SELECT p.id, p.purchaseDate, p.itemId, p.quantity, p.amount,
            (p.quantity * p.amount) AS totalAmount,
            i.name AS itemName, c.name AS categoryName, l.name AS languageName,
            u.username AS addedBy
      FROM purchases p
      LEFT JOIN items i ON p.itemId = i.id
      LEFT JOIN categories c ON i.categoryId = c.id
      LEFT JOIN languages l ON i.languageId = l.id
      LEFT JOIN users u ON p.userId = u.id
      ORDER BY p.purchaseDate DESC, p.id DESC`
  );
  res.json(rows);
};

export const createPurchase = async (req, res) => {
  const pool = req.app.locals.pool;
  const { itemId, quantity, amount, purchaseDate = new Date() } = req.body;

  const [itemRows] = await pool.query('SELECT isActive FROM items WHERE id = ?', [itemId]);
  if (itemRows.length === 0 || itemRows[0].isActive !== 1) {
    return res.status(400).json({ message: 'Purchase can only be recorded for an active item' });
  }

  const userId = req.user ? req.user.id : null;

  const [result] = await pool.query(
    'INSERT INTO purchases (itemId, quantity, amount, purchaseDate, userId) VALUES (?, ?, ?, ?, ?)',
    [itemId, quantity, amount, purchaseDate, userId]
  );
  res.status(201).json({ id: result.insertId, itemId, quantity, amount, purchaseDate, userId });
};
