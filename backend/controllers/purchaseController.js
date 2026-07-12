import xlsx from 'xlsx';

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

export const exportPurchases = async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    const [rows] = await pool.query(
      `SELECT p.id AS 'Stock ID', p.purchaseDate AS 'Date', p.itemId AS 'Item ID', 
              i.name AS 'Item Name', p.quantity AS 'Quantity', p.amount AS 'Price',
              (p.quantity * p.amount) AS 'Total Amount',
              u.username AS 'Added By'
       FROM purchases p
       LEFT JOIN items i ON p.itemId = i.id
       LEFT JOIN users u ON p.userId = u.id
       ORDER BY p.purchaseDate DESC, p.id DESC`
    );

    const worksheet = xlsx.utils.json_to_sheet(rows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Stock');
    
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="StockMaster.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ message: 'Failed to export stock' });
  }
};

export const importPurchases = async (req, res) => {
  const pool = req.app.locals.pool;
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (data.length === 0) {
      return res.status(400).json({ message: 'Excel file is empty' });
    }

    const userId = req.user ? req.user.id : null;
    let importedCount = 0;

    for (const row of data) {
      const itemId = row['Item ID'];
      const quantity = row['Quantity'];
      const amount = row['Price'] || 0;
      
      let purchaseDate = row['Date'];
      // Handle Excel date numbers if needed, or assume YYYY-MM-DD
      if (typeof purchaseDate === 'number') {
         // Convert Excel serial date to JS Date
         purchaseDate = new Date(Math.round((purchaseDate - 25569)*86400*1000));
      }
      
      if (!purchaseDate) {
        purchaseDate = new Date();
      }

      if (!itemId || !quantity) continue;
      
      await pool.query(
        'INSERT INTO purchases (itemId, quantity, amount, purchaseDate, userId) VALUES (?, ?, ?, ?, ?)',
        [itemId, quantity, amount, purchaseDate, userId]
      );
      importedCount++;
    }

    res.json({ message: `Successfully imported ${importedCount} stock records` });
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ message: 'Failed to import stock' });
  }
};
