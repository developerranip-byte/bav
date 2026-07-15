import pool from '../db.js';
import ExcelJS from 'exceljs';

export const getPurchases = async (req, res) => {
  
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const { itemId, startDate, endDate, sortBy, sortOrder } = req.query;

  const conditions = [];
  const params = [];

  if (itemId) {
    conditions.push('p.itemId = ?');
    params.push(itemId);
  }
  if (startDate) {
    conditions.push('p.purchaseDate >= ?');
    params.push(startDate);
  }
  if (endDate) {
    conditions.push('p.purchaseDate <= ?');
    params.push(endDate);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const allowedSortColumns = ['itemName', 'quantity', 'amount', 'purchaseDate', 'addedBy'];
  let orderByClause = 'ORDER BY p.purchaseDate DESC, p.id DESC';
  if (sortBy && allowedSortColumns.includes(sortBy)) {
    const direction = sortOrder === 'asc' ? 'ASC' : 'DESC';
    if (sortBy === 'itemName') {
      orderByClause = `ORDER BY i.name ${direction}, p.id DESC`;
    } else if (sortBy === 'addedBy') {
      orderByClause = `ORDER BY u.username ${direction}, p.id DESC`;
    } else {
      orderByClause = `ORDER BY p.${sortBy} ${direction}, p.id DESC`;
    }
  }

  const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM purchases p ${whereClause}`, params);
  const total = countRows[0].total;

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
      ${whereClause}
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

export const createPurchase = async (req, res) => {
  
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
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Stock');
    const dropdownSheet = workbook.addWorksheet('DropdownData');
    dropdownSheet.state = 'hidden';

    const [items] = await pool.query(`SELECT id, name FROM items WHERE isActive = 1`);
    dropdownSheet.getColumn('A').values = ['Items', ...items.map(i => i.name)];

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

    worksheet.columns = [
      { header: 'Stock ID', key: 'id', width: 10 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Item Name', key: 'itemName', width: 30 },
      { header: 'Quantity', key: 'qty', width: 15 },
      { header: 'Price', key: 'price', width: 15 },
      { header: 'Total Amount', key: 'total', width: 15 },
      { header: 'Added By', key: 'addedBy', width: 20 }
    ];

    rows.forEach(r => {
      worksheet.addRow({
        id: r['Stock ID'],
        date: r['Date'],
        itemName: r['Item Name'],
        qty: r['Quantity'],
        price: r['Price'],
        total: r['Total Amount'],
        addedBy: r['Added By']
      });
    });

    const todayStr = new Date().toISOString().split('T')[0];

    for (let i = 2; i <= 5000; i++) {
      if (items.length > 0) {
        worksheet.getCell(`C${i}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`DropdownData!$A$2:$A$${items.length + 1}`]
        };
      }
      
      // Date validation (column B)
      worksheet.getCell(`B${i}`).dataValidation = {
        type: 'date',
        operator: 'lessThanOrEqual',
        allowBlank: true,
        formulae: [new Date(todayStr)],
        showErrorMessage: true,
        errorTitle: 'Invalid Date',
        error: 'Future dates are not allowed.'
      };
      
      // Quantity validation (column D)
      worksheet.getCell(`D${i}`).dataValidation = {
        type: 'whole',
        operator: 'greaterThanOrEqual',
        allowBlank: true,
        formulae: [1],
        showErrorMessage: true,
        errorTitle: 'Invalid Quantity',
        error: 'Quantity must be a whole number greater than or equal to 1.'
      };
      
      // Auto-calculate Total Amount (column F)
      worksheet.getCell(`F${i}`).value = { formula: `IF(AND(ISNUMBER(D${i}), ISNUMBER(E${i})), D${i}*E${i}, "")` };
    }

    res.setHeader('Content-Disposition', 'attachment; filename="StockMaster.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    const buffer = await workbook.xlsx.writeBuffer();
    res.send(buffer);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ message: 'Failed to export stock' });
  }
};

export const importPurchases = async (req, res) => {
  if (req.user && req.user.userType !== 'super_admin') {
    return res.status(403).json({ message: 'Only super admin can import data' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.getWorksheet('Stock') || workbook.worksheets[0];

    if (!worksheet) {
      return res.status(400).json({ message: 'No readable sheet found' });
    }

    const [items] = await pool.query(`SELECT id, name FROM items`);
    const itemMap = {};
    items.forEach(i => itemMap[i.name] = i.id);

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

    const userId = req.user ? req.user.id : null;
    let importedCount = 0;

    for (const row of rows) {
      let itemName = headers['Item Name'] ? row.getCell(headers['Item Name']).value : null;
      if (!itemName) continue;
      if (typeof itemName === 'object') itemName = itemName.result || itemName.text;

      let quantity = headers['Quantity'] ? row.getCell(headers['Quantity']).value : null;
      if (typeof quantity === 'object') quantity = quantity.result || quantity.text;
      quantity = Number(quantity);
      if (isNaN(quantity) || quantity < 1) continue;

      let amount = headers['Price'] ? row.getCell(headers['Price']).value : 0;
      if (typeof amount === 'object') amount = amount.result || amount.text;
      amount = Number(amount) || 0;

      let purchaseDate = headers['Date'] ? row.getCell(headers['Date']).value : null;
      if (typeof purchaseDate === 'object' && purchaseDate instanceof Date) {
        // exceljs parses dates automatically if formatted as date
      } else if (typeof purchaseDate === 'number') {
        purchaseDate = new Date(Math.round((purchaseDate - 25569)*86400*1000));
      } else if (typeof purchaseDate === 'string') {
        purchaseDate = new Date(purchaseDate);
      }
      
      if (!purchaseDate || isNaN(purchaseDate.getTime())) {
        purchaseDate = new Date();
      }
      
      if (purchaseDate > new Date()) {
         purchaseDate = new Date();
      }

      const itemId = itemMap[itemName];
      if (!itemId) continue;
      
      let stockId = headers['Stock ID'] ? row.getCell(headers['Stock ID']).value : null;
      if (stockId && typeof stockId === 'object') stockId = stockId.result || stockId.text;
      stockId = Number(stockId);

      if (stockId && !isNaN(stockId) && stockId > 0) {
        await pool.query(
          'UPDATE purchases SET itemId = ?, quantity = ?, amount = ?, purchaseDate = ?, userId = ? WHERE id = ?',
          [itemId, quantity, amount, purchaseDate, userId, stockId]
        );
      } else {
        await pool.query(
          'INSERT INTO purchases (itemId, quantity, amount, purchaseDate, userId) VALUES (?, ?, ?, ?, ?)',
          [itemId, quantity, amount, purchaseDate, userId]
        );
      }
      importedCount++;
    }

    res.json({ message: `Successfully imported ${importedCount} stock records` });
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ message: 'Failed to import stock', error: err.message });
  }
};
