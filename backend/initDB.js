import mysql from 'mysql2/promise';
import 'dotenv/config';

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  userType VARCHAR(50) NOT NULL DEFAULT 'user',
  isActive TINYINT(1) NOT NULL DEFAULT 1,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  isActive TINYINT(1) NOT NULL DEFAULT 1,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS languages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  isActive TINYINT(1) NOT NULL DEFAULT 1,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  categoryId INT,
  languageId INT,
  isbn VARCHAR(255),
  openingQty INT NOT NULL DEFAULT 0,
  isActive TINYINT(1) NOT NULL DEFAULT 1,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (languageId) REFERENCES languages(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS purchases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  itemId INT NOT NULL,
  quantity INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  totalpurchaseamount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  purchaseDate DATE NOT NULL DEFAULT (CURRENT_DATE()),
  userId INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (itemId) REFERENCES items(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  itemId INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  salesPrice DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  salesDate DATE NOT NULL DEFAULT (CURRENT_DATE()),
  userId INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (itemId) REFERENCES items(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
);
`;

const initDB = async () => {
  console.log("Connecting to database...");
  const useSSL = process.env.DB_HOST && process.env.DB_HOST !== 'localhost';
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
    ...(useSSL && { ssl: { rejectUnauthorized: false } })
  });

  const dbName = process.env.DB_NAME || 'bav_db';
  console.log(`Creating database ${dbName} if not exists...`);
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await connection.query(`USE \`${dbName}\``);
  
  console.log("Running schema...");
  await connection.query(schema);

  const ensureColumn = async (table, column, definition) => {
    const [rows] = await connection.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [dbName, table, column]
    );
    if (!rows.length) {
      await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN ${definition}`);
      console.log(`Added column ${column} to ${table}`);
    }
  };

  const dropColumnIfExists = async (table, column) => {
    const [rows] = await connection.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [dbName, table, column]
    );
    if (rows.length) {
      await connection.query(`ALTER TABLE \`${table}\` DROP COLUMN \`${column}\``);
      console.log(`Dropped column ${column} from ${table}`);
    }
  };

  console.log("Applying column alterations...");
  await ensureColumn('items', 'isbn', 'isbn VARCHAR(255)');
  await ensureColumn('languages', 'isActive', 'isActive TINYINT(1) NOT NULL DEFAULT 1');
  await ensureColumn('items', 'updatedAt', 'updatedAt TIMESTAMP NULL DEFAULT NULL');
  await ensureColumn('purchases', 'totalpurchaseamount', 'totalpurchaseamount DECIMAL(12,2) NOT NULL DEFAULT 0.00');
  await ensureColumn('purchases', 'updatedAt', 'updatedAt TIMESTAMP NULL DEFAULT NULL');
  await ensureColumn('sales', 'updatedAt', 'updatedAt TIMESTAMP NULL DEFAULT NULL');
  await ensureColumn('sales', 'salesPrice', 'salesPrice DECIMAL(12,2) NOT NULL DEFAULT 0.00');
  await ensureColumn('purchases', 'userId', 'userId INT, ADD CONSTRAINT fk_purchases_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL');
  await ensureColumn('sales', 'userId', 'userId INT, ADD CONSTRAINT fk_sales_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL');
  await dropColumnIfExists('sales', 'amount');
  await dropColumnIfExists('sales', 'customerName');
  await dropColumnIfExists('sales', 'customerPhone');

  console.log("Ensuring default admin account...");
  const [userRows] = await connection.query('SELECT id FROM users WHERE username = ?', ['admin']);
  if (userRows.length === 0) {
    try {
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.hash('admin', 10);
      await connection.query('INSERT INTO users (username, password, userType) VALUES (?, ?, ?)', ['admin', hashedPassword, 'super_admin']);
      console.log('Default super_admin account created (admin/admin)');
    } catch (err) {
      console.error('Failed to create default admin account:', err);
    }
  }

  await connection.end();
  console.log("Database initialization complete.");
};

export default initDB;
