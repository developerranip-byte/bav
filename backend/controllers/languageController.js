export const getLanguages = async (req, res) => {
  const pool = req.app.locals.pool;
  const [rows] = await pool.query('SELECT * FROM languages ORDER BY id DESC');
  res.json(rows);
};

export const createLanguage = async (req, res) => {
  const pool = req.app.locals.pool;
  const { name, code } = req.body;
  const [result] = await pool.query(
    'INSERT INTO languages (name, code) VALUES (?, ?)',
    [name, code]
  );
  res.status(201).json({ id: result.insertId, name, code });
};
