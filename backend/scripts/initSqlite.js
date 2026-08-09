import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import 'dotenv/config';

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  userType TEXT NOT NULL DEFAULT 'user',
  isActive INTEGER NOT NULL DEFAULT 1,
  modules TEXT,
  centers TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  isActive INTEGER NOT NULL DEFAULT 1,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS languages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  isActive INTEGER NOT NULL DEFAULT 1,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS centers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  location TEXT,
  isActive INTEGER NOT NULL DEFAULT 1,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  categoryId INTEGER,
  languageId INTEGER,
  isbn TEXT,
  openingQty INTEGER NOT NULL DEFAULT 0,
  isActive INTEGER NOT NULL DEFAULT 1,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT NULL,
  FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (languageId) REFERENCES languages(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  itemId INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  amount REAL NOT NULL,
  totalpurchaseamount REAL NOT NULL DEFAULT 0.00,
  purchaseDate DATE NOT NULL DEFAULT (DATE('now')),
  userId INTEGER,
  centerId INTEGER,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT NULL,
  FOREIGN KEY (itemId) REFERENCES items(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (centerId) REFERENCES centers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  itemId INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  salesPrice REAL NOT NULL DEFAULT 0.00,
  salesDate DATE NOT NULL DEFAULT (DATE('now')),
  userId INTEGER,
  centerId INTEGER,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT NULL,
  FOREIGN KEY (itemId) REFERENCES items(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (centerId) REFERENCES centers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS counting_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  countingDate DATE NOT NULL DEFAULT (DATE('now')),
  gentsCount INTEGER DEFAULT 0,
  ladiesCount INTEGER DEFAULT 0,
  childrenCount INTEGER DEFAULT 0,
  balSatsangBoysCount INTEGER DEFAULT 0,
  balSatsangGirlsCount INTEGER DEFAULT 0,
  balPathiBoysCount INTEGER DEFAULT 0,
  balPathiGirlsCount INTEGER DEFAULT 0,
  mobileCount INTEGER DEFAULT 0,
  luggageCount INTEGER DEFAULT 0,
  threeWheelerCount INTEGER DEFAULT 0,
  twoWheelerCount INTEGER DEFAULT 0,
  fourWheelerCount INTEGER DEFAULT 0,
  carInCount INTEGER DEFAULT 0,
  carOutCount INTEGER DEFAULT 0,
  userId INTEGER,
  centerId INTEGER,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (centerId) REFERENCES centers(id) ON DELETE SET NULL
);
`;

const initSqlite = async () => {
  console.log("Connecting to SQLite database...");
  const sqlitePath = process.env.SQLITE_DB_PATH || './database.sqlite';
  
  const sqliteDb = await open({
    filename: sqlitePath,
    driver: sqlite3.Database
  });

  console.log("Running schema...");
  await sqliteDb.exec(schema);

  console.log("Ensuring default admin account...");
  const userRows = await sqliteDb.all('SELECT id FROM users WHERE username = ?', ['admin']);
  if (userRows.length === 0) {
    try {
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.hash('admin', 10);
      await sqliteDb.run('INSERT INTO users (username, password, userType) VALUES (?, ?, ?)', ['admin', hashedPassword, 'super_admin']);
      console.log('Default super_admin account created (admin/admin)');
    } catch (err) {
      console.error('Failed to create default admin account:', err);
    }
  }

  await sqliteDb.close();
  console.log("SQLite database initialization complete.");
};

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith('initSqlite.js')) {
  initSqlite().catch(console.error);
}

export default initSqlite;
