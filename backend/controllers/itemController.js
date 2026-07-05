export const getItems = async (req, res) => {
  const pool = req.app.locals.pool;
  const [rows] = await pool.query(
    `SELECT i.id, i.name, i.categoryId, i.languageId, i.isbn, i.openingQty, i.isActive,
            c.name AS categoryName, l.name AS languageName, l.code AS languageCode
      FROM items i
      LEFT JOIN categories c ON i.categoryId = c.id
      LEFT JOIN languages l ON i.languageId = l.id
      ORDER BY i.id DESC`
  );
  res.json(rows);
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
