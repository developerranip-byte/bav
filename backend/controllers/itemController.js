export const getItems = async (req, res) => {
  const pool = req.app.locals.pool;
  const [rows] = await pool.query(
    `SELECT i.id, i.name, i.categoryId, i.languageId, i.openingQty, i.isActive,
            c.name AS categoryName, l.name AS languageName, l.code AS languageCode
      FROM items i
      LEFT JOIN categories c ON i.categoryId = c.id
      LEFT JOIN languages l ON i.languageId = l.id
      ORDER BY i.id DESC`
  );
  res.json(rows);
};

export const createItem = async (req, res) => {
  const pool = req.app.locals.pool;
  const { name, categoryId, languageId, openingQty = 0, isActive = true } = req.body;
  const [result] = await pool.query(
    'INSERT INTO items (name, categoryId, languageId, openingQty, isActive) VALUES (?, ?, ?, ?, ?)',
    [name, categoryId || null, languageId || null, openingQty, isActive ? 1 : 0]
  );
  res.status(201).json({
    id: result.insertId,
    name,
    categoryId,
    languageId,
    openingQty,
    isActive,
  });
};
