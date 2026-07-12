import xlsx from 'xlsx';

export const getItems = async (req, res) => {
  const pool = req.app.locals.pool;
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
    conditions.push('(items.name LIKE ? OR items.isbn LIKE ?)');
    params.push(like, like);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const allowedSortColumns = ['name', 'categoryName', 'languageName', 'isbn', 'isActive'];
  let orderByClause = 'ORDER BY i.id DESC';
  if (sortBy && allowedSortColumns.includes(sortBy)) {
    const direction = sortOrder === 'asc' ? 'ASC' : 'DESC';
    if (sortBy === 'categoryName') {
      orderByClause = `ORDER BY c.name ${direction}, i.id DESC`;
    } else if (sortBy === 'languageName') {
      orderByClause = `ORDER BY l.name ${direction}, i.id DESC`;
    } else {
      orderByClause = `ORDER BY i.${sortBy} ${direction}, i.id DESC`;
    }
  }

  const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM items ${whereClause}`, params);
  const total = countRows[0].total;

  const [rows] = await pool.query(
    `SELECT i.id, i.name, i.categoryId, i.languageId, i.isbn, i.openingQty, i.isActive,
            c.name AS categoryName, l.name AS languageName, l.code AS languageCode,
            COALESCE((
              SELECT p.amount
              FROM purchases p
              WHERE p.itemId = i.id
              ORDER BY p.purchaseDate DESC, p.id DESC
              LIMIT 1
            ), 0.00) AS lastPurchasePrice
      FROM items i
      LEFT JOIN categories c ON i.categoryId = c.id
      LEFT JOIN languages l ON i.languageId = l.id
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

export const searchItems = async (req, res) => {
  const pool = req.app.locals.pool;
  const query = (req.query.q || '').trim();
  if (!query) {
    return res.json([]);
  }
  const like = `%${query}%`;
  const [rows] = await pool.query(
    `SELECT id, name, isbn, categoryId, languageId, openingQty, isActive
       FROM items
      WHERE isActive = 1 AND (name LIKE ? OR isbn LIKE ?)
      ORDER BY name
      LIMIT 10`,
    [like, like]
  );
  res.json(rows);
};

export const createItem = async (req, res) => {
  const pool = req.app.locals.pool;
  const { name, categoryId, languageId, isbn = null, openingQty = 0, isActive = true } = req.body;
  const [result] = await pool.query(
    'INSERT INTO items (name, categoryId, languageId, isbn, openingQty, isActive) VALUES (?, ?, ?, ?, ?, ?)',
    [name, categoryId || null, languageId || null, isbn || null, openingQty, isActive ? 1 : 0]
  );
  res.status(201).json({
    id: result.insertId,
    name,
    categoryId,
    languageId,
    isbn,
    openingQty,
    isActive,
  });
};

export const updateItem = async (req, res) => {
  const pool = req.app.locals.pool;
  const { id } = req.params;
  const { name, categoryId, languageId, isbn = null, openingQty = 0, isActive = true } = req.body;
  await pool.query(
    'UPDATE items SET name = ?, categoryId = ?, languageId = ?, isbn = ?, openingQty = ?, isActive = ? WHERE id = ?',
    [name, categoryId || null, languageId || null, isbn || null, openingQty, isActive ? 1 : 0, id]
  );
  res.json({ id: Number(id), name, categoryId, languageId, isbn, openingQty, isActive });
};

export const deleteItem = async (req, res) => {
  const pool = req.app.locals.pool;
  const { id } = req.params;
  await pool.query('DELETE FROM items WHERE id = ?', [id]);
  res.status(204).end();
};

export const exportItems = async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    const [rows] = await pool.query(
      `SELECT i.id AS 'Item ID', i.name AS 'Name', i.isbn AS 'ISBN', 
              i.openingQty AS 'Opening Qty',
              c.name AS 'Category', l.name AS 'Language',
              i.categoryId AS 'Category ID', i.languageId AS 'Language ID'
       FROM items i
       LEFT JOIN categories c ON i.categoryId = c.id
       LEFT JOIN languages l ON i.languageId = l.id
       ORDER BY i.id DESC`
    );

    const worksheet = xlsx.utils.json_to_sheet(rows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Items');
    
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="ItemsMaster.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ message: 'Failed to export items' });
  }
};

export const importItems = async (req, res) => {
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

    let importedCount = 0;
    for (const row of data) {
      const name = row['Name'];
      if (!name) continue;

      const categoryId = row['Category ID'] || null;
      const languageId = row['Language ID'] || null;
      const isbn = row['ISBN'] || null;
      const openingQty = row['Opening Qty'] || 0;
      
      await pool.query(
        'INSERT INTO items (name, categoryId, languageId, isbn, openingQty, isActive) VALUES (?, ?, ?, ?, ?, 1)',
        [name, categoryId, languageId, isbn, openingQty]
      );
      importedCount++;
    }

    res.json({ message: `Successfully imported ${importedCount} items` });
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ message: 'Failed to import items' });
  }
};
