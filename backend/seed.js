import 'dotenv/config';
import mysql from 'mysql2/promise';

const seed = async () => {
  const dbName = process.env.DB_NAME || 'bavdb';
  console.log(`Connecting to database "${dbName}" at ${process.env.DB_HOST || 'localhost'}...`);

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: dbName,
    multipleStatements: true,
  });

  console.log('Clearing existing data from tables...');
  await connection.query('SET FOREIGN_KEY_CHECKS = 0');
  await connection.query('TRUNCATE TABLE sales');
  await connection.query('TRUNCATE TABLE purchases');
  await connection.query('TRUNCATE TABLE items');
  await connection.query('TRUNCATE TABLE categories');
  await connection.query('TRUNCATE TABLE languages');
  await connection.query('SET FOREIGN_KEY_CHECKS = 1');
  console.log('Existing tables cleared.');

  // 1. Insert Categories
  console.log('Inserting sample categories...');
  const categories = [
    ['Books', 'Spiritual and literature books', 1],
    ['Audio & Video', 'Satsang recordings and audio books', 1],
    ['Magazines', 'Monthly and quarterly publication magazines', 1],
    ['Accessories', 'Photos, diaries, and general items', 1]
  ];
  
  const categoryIds = [];
  for (const cat of categories) {
    const [res] = await connection.query(
      'INSERT INTO categories (name, description, isActive) VALUES (?, ?, ?)',
      cat
    );
    categoryIds.push(res.insertId);
  }
  console.log(`Inserted ${categoryIds.length} categories.`);

  // 2. Insert Languages
  console.log('Inserting sample languages...');
  const languages = [
    ['English', 'en', 1],
    ['Hindi', 'hi', 1],
    ['Gujarati', 'gj', 1],
    ['Punjabi', 'pb', 1]
  ];

  const languageIds = [];
  for (const lang of languages) {
    const [res] = await connection.query(
      'INSERT INTO languages (name, code, isActive) VALUES (?, ?, ?)',
      lang
    );
    languageIds.push(res.insertId);
  }
  console.log(`Inserted ${languageIds.length} languages.`);

  // 3. Insert Items
  console.log('Inserting sample items...');
  const items = [
    ['Spiritual Living', categoryIds[0], languageIds[0], '978-3-16-148410-0', 10, 1],
    ['Dhyan Sadhna Vol 1', categoryIds[1], languageIds[1], 'CD-DHYAN-01', 5, 1],
    ['Satsang Monthly June 2026', categoryIds[2], languageIds[2], 'MAG-JUNE-26', 50, 1],
    ['Vegetarian Recipes', categoryIds[0], languageIds[0], '978-0-12-345678-9', 12, 1],
    ['Gita Pravachan', categoryIds[0], languageIds[1], '978-1-23-456789-0', 15, 1]
  ];

  const itemIds = [];
  const itemPurchasePrices = {};
  for (const item of items) {
    const [res] = await connection.query(
      'INSERT INTO items (name, categoryId, languageId, isbn, openingQty, isActive) VALUES (?, ?, ?, ?, ?, ?)',
      item
    );
    itemIds.push(res.insertId);
  }
  console.log(`Inserted ${itemIds.length} items.`);

  // 4. Insert Purchases (Rates/Prices in 'amount', Total in 'totalpurchaseamount')
  console.log('Inserting sample purchases...');
  const purchases = [
    [itemIds[0], 20, 15.00, 20 * 15.00, '2026-07-01'], // Spiritual Living: 20 units @ $15.00/unit
    [itemIds[1], 10, 8.50, 10 * 8.50, '2026-07-02'],  // Dhyan Sadhna: 10 units @ $8.50/unit
    [itemIds[2], 100, 2.00, 100 * 2.00, '2026-07-03'], // Satsang Monthly: 100 units @ $2.00/unit
    [itemIds[3], 15, 10.00, 15 * 10.00, '2026-07-04'], // Vegetarian Recipes: 15 units @ $10.00/unit
    [itemIds[4], 25, 12.00, 25 * 12.00, '2026-07-05']  // Gita Pravachan: 25 units @ $12.00/unit
  ];

  for (const pur of purchases) {
    await connection.query(
      'INSERT INTO purchases (itemId, quantity, amount, totalpurchaseamount, purchaseDate) VALUES (?, ?, ?, ?, ?)',
      pur
    );
    itemPurchasePrices[pur[0]] = pur[2];
  }
  console.log('Sample purchases recorded.');

  // 5. Insert Sales (Calculated based on purchase unit price * sale quantity)
  console.log('Inserting sample sales...');
  const sales = [
    [itemIds[0], 5, itemPurchasePrices[itemIds[0]] * 5, '2026-07-06'],  // Spiritual Living: 5 units @ $15.00 = $75.00
    [itemIds[1], 2, itemPurchasePrices[itemIds[1]] * 2, '2026-07-07'],  // Dhyan Sadhna: 2 units @ $8.50 = $17.00
    [itemIds[2], 30, itemPurchasePrices[itemIds[2]] * 30, '2026-07-08'], // Satsang Monthly: 30 units @ $2.00 = $60.00
    [itemIds[3], 4, itemPurchasePrices[itemIds[3]] * 4, '2026-07-09']   // Vegetarian Recipes: 4 units @ $10.00 = $40.00
  ];

  for (const sale of sales) {
    await connection.query(
      'INSERT INTO sales (itemId, quantity, salesPrice, salesDate) VALUES (?, ?, ?, ?)',
      sale
    );
  }
  console.log('Sample sales recorded.');

  await connection.end();
  console.log('Database seeding completed successfully!');
};

seed().catch(err => {
  console.error('Error seeding database:', err);
  process.exit(1);
});
