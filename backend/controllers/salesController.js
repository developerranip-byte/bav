import pool from '../db.js';
import ExcelJS from 'exceljs';
export const getSales = async (req, res) => {
  
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const { itemId, startDate, endDate, sortBy, sortOrder } = req.query;

  const conditions = [];
  const params = [];

  if (itemId) {
    conditions.push('s.itemId = ?');
    params.push(itemId);
  }
  if (startDate) {
    conditions.push('s.salesDate >= ?');
    params.push(startDate);
  }
  if (endDate) {
    conditions.push('s.salesDate <= ?');
    params.push(endDate);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const allowedSortColumns = ['itemName', 'quantity', 'salesPrice', 'salesDate', 'addedBy'];
  let orderByClause = 'ORDER BY s.salesDate DESC, s.id DESC';
  if (sortBy && allowedSortColumns.includes(sortBy)) {
    const direction = sortOrder === 'asc' ? 'ASC' : 'DESC';
    if (sortBy === 'itemName') {
      orderByClause = `ORDER BY i.name ${direction}, s.id DESC`;
    } else if (sortBy === 'addedBy') {
      orderByClause = `ORDER BY u.username ${direction}, s.id DESC`;
    } else {
      orderByClause = `ORDER BY s.${sortBy} ${direction}, s.id DESC`;
    }
  }

  const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM sales s ${whereClause}`, params);
  const total = countRows[0].total;

  const [rows] = await pool.query(
    `SELECT s.id, s.itemId, s.quantity, s.salesPrice, s.salesDate,
            s.salesPrice AS totalAmount,
            i.name AS itemName,
            u.username AS addedBy
      FROM sales s
      LEFT JOIN items i ON s.itemId = i.id
      LEFT JOIN users u ON s.userId = u.id
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

export const createSale = async (req, res) => {
  
  const { itemId, quantity = 1, salesPrice = 0.00, salesDate = new Date() } = req.body;

  if (!itemId || !Number(itemId)) {
    return res.status(400).json({ message: 'Item is required' });
  }
  if (!quantity || quantity <= 0) {
    return res.status(400).json({ message: 'Sales quantity must be greater than zero' });
  }

  // Check if item exists and is active
  const [itemRows] = await pool.query('SELECT isActive FROM items WHERE id = ?', [itemId]);
  if (itemRows.length === 0) {
    return res.status(400).json({ message: 'Item not found' });
  }
  if (itemRows[0].isActive !== 1) {
    return res.status(400).json({ message: 'Sale can only be recorded for an active item' });
  }

  // Get opening quantity from items table
  const [openingRows] = await pool.query('SELECT openingQty FROM items WHERE id = ?', [itemId]);
  const openingQty = Number(openingRows[0]?.openingQty || 0);

  // Get total purchased quantity from purchases table
  const [purchaseRows] = await pool.query(
    'SELECT COALESCE(SUM(quantity), 0) AS totalPurchased FROM purchases WHERE itemId = ?',
    [itemId]
  );
  const purchasedQty = Number(purchaseRows[0]?.totalPurchased || 0);

  // Get total sold quantity from sales table
  const [salesRows] = await pool.query(
    'SELECT COALESCE(SUM(quantity), 0) AS totalSold FROM sales WHERE itemId = ?',
    [itemId]
  );
  const soldQty = Number(salesRows[0]?.totalSold || 0);

  // Calculate available quantity
  const available = openingQty + purchasedQty - soldQty;
  if (quantity > available) {
    return res.status(400).json({ message: `Sales quantity cannot exceed available stock (${available})` });
  }

  const userId = req.user ? req.user.id : null;

  const [result] = await pool.query(
    'INSERT INTO sales (itemId, quantity, salesPrice, salesDate, userId) VALUES (?, ?, ?, ?, ?)',
    [itemId, quantity, salesPrice, salesDate, userId]
  );

  res.status(201).json({ id: result.insertId, itemId, quantity, salesPrice, salesDate, userId });
};

export const exportSales = async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales');
    const dropdownSheet = workbook.addWorksheet('DropdownData');
    dropdownSheet.state = 'hidden';

    const [items] = await pool.query(`SELECT id, name FROM items WHERE isActive = 1`);
    dropdownSheet.getColumn('A').values = ['Items', ...items.map(i => i.name)];

    const [rows] = await pool.query(
      `SELECT s.id AS 'Sale ID', s.salesDate AS 'Date', s.itemId AS 'Item ID', 
              i.name AS 'Item Name', s.quantity AS 'Quantity', s.salesPrice AS 'Price',
              u.username AS 'Added By'
       FROM sales s
       LEFT JOIN items i ON s.itemId = i.id
       LEFT JOIN users u ON s.userId = u.id
       ORDER BY s.salesDate DESC, s.id DESC`
    );

    worksheet.columns = [
      { header: 'Sale ID', key: 'id', width: 10 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Item Name', key: 'itemName', width: 30 },
      { header: 'Quantity', key: 'qty', width: 15 },
      { header: 'Price', key: 'price', width: 15 },
      { header: 'Added By', key: 'addedBy', width: 20 }
    ];

    rows.forEach(r => {
      worksheet.addRow({
        id: r['Sale ID'],
        date: r['Date'],
        itemName: r['Item Name'],
        qty: r['Quantity'],
        price: r['Price'],
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
    }

    res.setHeader('Content-Disposition', 'attachment; filename="SalesMaster.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    const buffer = await workbook.xlsx.writeBuffer();
    res.send(buffer);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ message: 'Failed to export sales' });
  }
};

export const importSales = async (req, res) => {
  if (req.user && req.user.userType !== 'super_admin') {
    return res.status(403).json({ message: 'Only super admin can import data' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.getWorksheet('Sales') || workbook.worksheets[0];

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

      let salesPrice = headers['Price'] ? row.getCell(headers['Price']).value : 0;
      if (typeof salesPrice === 'object') salesPrice = salesPrice.result || salesPrice.text;
      salesPrice = Number(salesPrice) || 0;

      let salesDate = headers['Date'] ? row.getCell(headers['Date']).value : null;
      if (typeof salesDate === 'object' && salesDate instanceof Date) {
        // ok
      } else if (typeof salesDate === 'number') {
        salesDate = new Date(Math.round((salesDate - 25569)*86400*1000));
      } else if (typeof salesDate === 'string') {
        salesDate = new Date(salesDate);
      }
      
      if (!salesDate || isNaN(salesDate.getTime()) || salesDate > new Date()) {
        salesDate = new Date();
      }

      const itemId = itemMap[itemName];
      if (!itemId) continue;
      
      // Basic stock validation (to match UI, though simpler to just insert or do strict check)
      const [openingRows] = await pool.query('SELECT openingQty FROM items WHERE id = ?', [itemId]);
      const openingQty = Number(openingRows[0]?.openingQty || 0);

      const [purchaseRows] = await pool.query('SELECT COALESCE(SUM(quantity), 0) AS totalPurchased FROM purchases WHERE itemId = ?', [itemId]);
      const purchasedQty = Number(purchaseRows[0]?.totalPurchased || 0);

      const [salesRows] = await pool.query('SELECT COALESCE(SUM(quantity), 0) AS totalSold FROM sales WHERE itemId = ?', [itemId]);
      const soldQty = Number(salesRows[0]?.totalSold || 0);

      const available = openingQty + purchasedQty - soldQty;
      
      if (quantity > available) {
        // Skip importing this row if not enough stock
        continue;
      }
      
      await pool.query(
        'INSERT INTO sales (itemId, quantity, salesPrice, salesDate, userId) VALUES (?, ?, ?, ?, ?)',
        [itemId, quantity, salesPrice, salesDate, userId]
      );
      importedCount++;
    }

    res.json({ message: `Successfully imported ${importedCount} sales records` });
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ message: 'Failed to import sales' });
  }
};
