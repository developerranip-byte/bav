import mysql from 'mysql2/promise';

const schema = `
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
  purchaseDate DATE NOT NULL DEFAULT (CURRENT_DATE()),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (itemId) REFERENCES items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  itemId INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  amount DECIMAL(12,2) NOT NULL,
  salesDate DATE NOT NULL DEFAULT (CURRENT_DATE()),
  customerName VARCHAR(255) NOT NULL,
  customerPhone VARCHAR(50) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (itemId) REFERENCES items(id) ON DELETE CASCADE
);
`;

const initializeDatabase = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    // allow executing multiple statements in the schema string
    multipleStatements: true,
  });

  const dbName = process.env.DB_NAME || 'bav_db';
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await connection.query(`USE \`${dbName}\``);
  await connection.query(schema);

  const ensureColumn = async (table, column, definition) => {
    const [rows] = await connection.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [dbName, table, column]
    );
    if (!rows.length) {
      await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN ${definition}`);
    }
  };

  await ensureColumn('items', 'isbn', 'isbn VARCHAR(255)');
  await ensureColumn('languages', 'isActive', 'isActive TINYINT(1) NOT NULL DEFAULT 1');
  await ensureColumn('items', 'updatedAt', 'updatedAt TIMESTAMP NULL DEFAULT NULL');
  await ensureColumn('purchases', 'updatedAt', 'updatedAt TIMESTAMP NULL DEFAULT NULL');
  await ensureColumn('sales', 'updatedAt', 'updatedAt TIMESTAMP NULL DEFAULT NULL');
  await connection.end();

  return mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: dbName,
    // enable multi-statement execution for pool as well
    multipleStatements: true,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
};

export default initializeDatabase;
