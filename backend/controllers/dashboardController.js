export const getDashboardStats = async (req, res) => {
  const pool = req.app.locals.pool;

  try {
    // 1. Stats Counts
    const [[{ languages }]] = await pool.query('SELECT COUNT(*) AS languages FROM languages');
    const [[{ categories }]] = await pool.query('SELECT COUNT(*) AS categories FROM categories');
    const [[{ items }]] = await pool.query('SELECT COUNT(*) AS items FROM items');

    // 2. Today's Stats
    const [[salesToday]] = await pool.query(`
      SELECT COALESCE(SUM(quantity), 0) AS soldQty, 
             COALESCE(SUM(salesPrice), 0) AS soldAmount 
      FROM sales 
      WHERE DATE(salesDate) = CURRENT_DATE()
    `);

    const [[purchasesToday]] = await pool.query(`
      SELECT COALESCE(SUM(quantity), 0) AS purchasedQty, 
             COALESCE(SUM(quantity * amount), 0) AS purchasedAmount 
      FROM purchases 
      WHERE DATE(purchaseDate) = CURRENT_DATE()
    `);

    // 3. Weekly History
    const [weeklySales] = await pool.query(`
      SELECT s.id, s.quantity, s.salesDate, 
             i.name AS itemName, 
             u.username AS addedBy 
      FROM sales s 
      LEFT JOIN items i ON s.itemId = i.id 
      LEFT JOIN users u ON s.userId = u.id 
      WHERE s.salesDate >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY) 
      ORDER BY s.salesDate DESC
    `);

    const [weeklyPurchases] = await pool.query(`
      SELECT p.id, p.quantity, p.purchaseDate, 
             i.name AS itemName, 
             u.username AS addedBy 
      FROM purchases p 
      LEFT JOIN items i ON p.itemId = i.id 
      LEFT JOIN users u ON p.userId = u.id 
      WHERE p.purchaseDate >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY) 
      ORDER BY p.purchaseDate DESC
    `);

    res.json({
      stats: { languages, categories, items },
      todayStats: {
        soldQty: Number(salesToday.soldQty),
        soldAmount: Number(salesToday.soldAmount),
        purchasedQty: Number(purchasesToday.purchasedQty),
        purchasedAmount: Number(purchasesToday.purchasedAmount)
      },
      weeklySales,
      weeklyPurchases
    });
  } catch (err) {
    console.error('Failed to fetch dashboard stats:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
