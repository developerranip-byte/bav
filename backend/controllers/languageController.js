export const getLanguages = async (req, res) => {
  const pool = req.app.locals.pool;
  const [rows] = await pool.query('SELECT * FROM languages ORDER BY id DESC');
  res.json(rows);
};

export const createLanguage = async (req, res) => {
  const pool = req.app.locals.pool;
  const { name, code, isActive = true } = req.body;
  const [result] = await pool.query(
    'INSERT INTO languages (name, code, isActive) VALUES (?, ?, ?)',
    [name, code, isActive ? 1 : 0]
  );
  res.status(201).json({ id: result.insertId, name, code, isActive });
};

export const updateLanguage = async (req, res) => {
  const pool = req.app.locals.pool;
  const { id } = req.params;
  const { name, code, isActive = true } = req.body;
  await pool.query('UPDATE languages SET name = ?, code = ?, isActive = ? WHERE id = ?', [name, code, isActive ? 1 : 0, id]);
  res.json({ id: Number(id), name, code, isActive });
};

export const deleteLanguage = async (req, res) => {
  const pool = req.app.locals.pool;
  const { id } = req.params;
  await pool.query('DELETE FROM languages WHERE id = ?', [id]);
  res.status(204).end();
};
