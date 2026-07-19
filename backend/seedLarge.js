import 'dotenv/config';
import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';

const seedLarge = async () => {
  const dbName = process.env.DB_NAME || 'bav_db';
  console.log(`Connecting to database "${dbName}" at ${process.env.DB_HOST || 'localhost'}...`);

  const useSSL = process.env.DB_HOST && process.env.DB_HOST !== 'localhost';
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: dbName,
    multipleStatements: true,
    ...(useSSL && { ssl: { rejectUnauthorized: false } })
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
  console.log('Inserting 500 sample categories...');
  const categories = [];
  for (let i = 1; i <= 500; i++) {
    categories.push([`Category ${i}`, `Description for category ${i}`, 1]);
  }
  await connection.query('INSERT INTO categories (name, description, isActive) VALUES ?', [categories]);
  
  // Get generated Category IDs
  const [catRows] = await connection.query('SELECT id FROM categories');
  const categoryIds = catRows.map(row => row.id);

  // 2. Insert Languages
  console.log('Inserting 500 sample languages...');
  const languages = [];
  for (let i = 1; i <= 500; i++) {
    languages.push([`Language ${i}`, `L${i}`, 1]);
  }
  await connection.query('INSERT INTO languages (name, code, isActive) VALUES ?', [languages]);
  
  // Get generated Language IDs
  const [langRows] = await connection.query('SELECT id FROM languages');
  const languageIds = langRows.map(row => row.id);

  // 3. Insert Items
  console.log('Inserting 500 sample items...');
  const items = [];
  for (let i = 1; i <= 500; i++) {
    const rCat = categoryIds[Math.floor(Math.random() * categoryIds.length)];
    const rLang = languageIds[Math.floor(Math.random() * languageIds.length)];
    items.push([`Test Item ${i}`, rCat, rLang, `ISBN-${1000 + i}`, Math.floor(Math.random() * 50) + 1, 1]);
  }
  await connection.query('INSERT INTO items (name, categoryId, languageId, isbn, openingQty, isActive) VALUES ?', [items]);

  // Get generated Item IDs
  const [itemRows] = await connection.query('SELECT id FROM items');
  const itemIds = itemRows.map(row => row.id);

  // 4. Insert Purchases
  console.log('Inserting 500 sample purchases...');
  const purchases = [];
  for (let i = 1; i <= 500; i++) {
    const rItem = itemIds[Math.floor(Math.random() * itemIds.length)];
    const qty = Math.floor(Math.random() * 100) + 10;
    const amount = (Math.random() * 50 + 5).toFixed(2);
    const totalAmount = (qty * amount).toFixed(2);
    const pDate = new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString().slice(0, 10);
    purchases.push([rItem, qty, amount, totalAmount, pDate, 1]);
  }
  await connection.query('INSERT INTO purchases (itemId, quantity, amount, totalpurchaseamount, purchaseDate, userId) VALUES ?', [purchases]);

  // 5. Insert Sales
  console.log('Inserting 500 sample sales...');
  const sales = [];
  for (let i = 1; i <= 500; i++) {
    const rItem = itemIds[Math.floor(Math.random() * itemIds.length)];
    const qty = Math.floor(Math.random() * 5) + 1;
    const salePrice = (Math.random() * 60 + 10).toFixed(2);
    const sDate = new Date(Date.now() - Math.floor(Math.random() * 5000000000)).toISOString().slice(0, 10);
    sales.push([rItem, qty, salePrice, sDate, 1]);
  }
  await connection.query('INSERT INTO sales (itemId, quantity, salesPrice, salesDate, userId) VALUES ?', [sales]);

  await connection.end();
  console.log('Database large seeding completed successfully!');
};

export default seedLarge;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedLarge().then(() => process.exit(0)).catch(err => {
    console.error('Error seeding database:', err);
    process.exit(1);
  });
}
