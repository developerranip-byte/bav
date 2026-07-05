export const getCategories = async (req, res) => {
  const pool = req.app.locals.pool;
  const [rows] = await pool.query('SELECT * FROM categories ORDER BY id DESC');
  res.json(rows);
};

export const createCategory = async (req, res) => {
  const pool = req.app.locals.pool;
  const { name, description = '', isActive = true } = req.body;
  const [result] = await pool.query(
    'INSERT INTO categories (name, description, isActive) VALUES (?, ?, ?)',
    [name, description, isActive ? 1 : 0]
  );
  res.status(201).json({ id: result.insertId, name, description, isActive });
};

export const updateCategory = async (req, res) => {
  const pool = req.app.locals.pool;
  const { id } = req.params;
  const { name, description = '', isActive = true } = req.body;
  await pool.query('UPDATE categories SET name = ?, description = ?, isActive = ? WHERE id = ?', [name, description, isActive ? 1 : 0, id]);
  res.json({ id: Number(id), name, description, isActive });
};

export const deleteCategory = async (req, res) => {
  const pool = req.app.locals.pool;
  const { id } = req.params;
  await pool.query('DELETE FROM categories WHERE id = ?', [id]);
  res.status(204).end();
};
