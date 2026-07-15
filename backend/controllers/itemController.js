import pool from '../db.js';
import ExcelJS from 'exceljs';

export const getItems = async (req, res) => {
  
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
  
  const { id } = req.params;
  const { name, categoryId, languageId, isbn = null, openingQty = 0, isActive = true } = req.body;
  await pool.query(
    'UPDATE items SET name = ?, categoryId = ?, languageId = ?, isbn = ?, openingQty = ?, isActive = ? WHERE id = ?',
    [name, categoryId || null, languageId || null, isbn || null, openingQty, isActive ? 1 : 0, id]
  );
  res.json({ id: Number(id), name, categoryId, languageId, isbn, openingQty, isActive });
};

export const deleteItem = async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM items WHERE id = ?', [id]);
  res.status(204).end();
};

export const bulkDeleteItems = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No item IDs provided' });
    }
    
    // Create a dynamic query with ? placeholders based on the number of ids
    const placeholders = ids.map(() => '?').join(',');
    await pool.query(`DELETE FROM items WHERE id IN (${placeholders})`, ids);
    
    res.status(204).end();
  } catch (err) {
    console.error('Bulk delete error:', err);
    res.status(500).json({ message: 'Failed to delete items', error: err.message });
  }
};

export const exportItems = async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Items');
    const dropdownSheet = workbook.addWorksheet('DropdownData');
    dropdownSheet.state = 'hidden';

    const [categories] = await pool.query(`SELECT id, name FROM categories WHERE isActive = 1`);
    const [languages] = await pool.query(`SELECT id, name FROM languages WHERE isActive = 1`);

    dropdownSheet.getColumn('A').values = ['Categories', ...categories.map(c => c.name)];
    dropdownSheet.getColumn('B').values = ['Languages', ...languages.map(l => l.name)];

    const [rows] = await pool.query(
      `SELECT i.id AS 'Item ID', i.name AS 'Name', i.isbn AS 'ISBN', 
              c.name AS 'Category', l.name AS 'Language'
       FROM items i
       LEFT JOIN categories c ON i.categoryId = c.id
       LEFT JOIN languages l ON i.languageId = l.id
       ORDER BY i.id DESC`
    );

    worksheet.columns = [
      { header: 'Item ID', key: 'id', width: 10 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Category', key: 'category', width: 25 },
      { header: 'Language', key: 'language', width: 25 },
      { header: 'ISBN', key: 'isbn', width: 20 }
    ];

    rows.forEach(r => {
      worksheet.addRow({
        id: r['Item ID'],
        name: r['Name'],
        category: r['Category'],
        language: r['Language'],
        isbn: r['ISBN']
      });
    });

    for (let i = 2; i <= 5000; i++) {
      if (categories.length > 0) {
        worksheet.getCell(`C${i}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`DropdownData!$A$2:$A$${categories.length + 1}`]
        };
      }
      if (languages.length > 0) {
        worksheet.getCell(`D${i}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`DropdownData!$B$2:$B$${languages.length + 1}`]
        };
      }
    }

    res.setHeader('Content-Disposition', 'attachment; filename="ItemsMaster.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    const buffer = await workbook.xlsx.writeBuffer();
    res.send(buffer);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ message: 'Failed to export items' });
  }
};

export const importItems = async (req, res) => {
  if (req.user && req.user.userType !== 'super_admin') {
    return res.status(403).json({ message: 'Only super admin can import data' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.getWorksheet('Items') || workbook.worksheets[0];

    if (!worksheet) {
      return res.status(400).json({ message: 'No readable sheet found' });
    }

    const [categories] = await pool.query(`SELECT id, name FROM categories`);
    const [languages] = await pool.query(`SELECT id, name FROM languages`);
    
    const categoryMap = {};
    categories.forEach(c => categoryMap[c.name] = c.id);
    const languageMap = {};
    languages.forEach(l => languageMap[l.name] = l.id);

    let headers = {};
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      if (cell.value) headers[cell.value.toString().trim()] = colNumber;
    });

    const rows = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) rows.push(row);
    });

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Excel file is empty' });
    }

    let importedCount = 0;
    for (const row of rows) {
      let name = headers['Name'] ? row.getCell(headers['Name']).value : null;
      if (!name) continue;
      if (typeof name === 'object') name = name.result || name.text;

      let categoryName = headers['Category'] ? row.getCell(headers['Category']).value : null;
      if (categoryName && typeof categoryName === 'object') categoryName = categoryName.result || categoryName.text;

      let languageName = headers['Language'] ? row.getCell(headers['Language']).value : null;
      if (languageName && typeof languageName === 'object') languageName = languageName.result || languageName.text;

      let isbn = headers['ISBN'] ? row.getCell(headers['ISBN']).value : null;
      if (isbn && typeof isbn === 'object') isbn = isbn.result || isbn.text;

      const categoryId = categoryMap[categoryName] || null;
      const languageId = languageMap[languageName] || null;
      
      let itemId = headers['Item ID'] ? row.getCell(headers['Item ID']).value : null;
      if (itemId && typeof itemId === 'object') itemId = itemId.result || itemId.text;
      itemId = Number(itemId);

      if (itemId && !isNaN(itemId) && itemId > 0) {
        await pool.query(
          'UPDATE items SET name = ?, categoryId = ?, languageId = ?, isbn = ?, openingQty = 0 WHERE id = ?',
          [name, categoryId, languageId, isbn, itemId]
        );
      } else {
        await pool.query(
          'INSERT INTO items (name, categoryId, languageId, isbn, openingQty, isActive) VALUES (?, ?, ?, ?, 0, 1)',
          [name, categoryId, languageId, isbn]
        );
      }
      importedCount++;
    }

    res.json({ message: `Successfully imported ${importedCount} items` });
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ message: 'Failed to import items', error: err.message });
  }
};
