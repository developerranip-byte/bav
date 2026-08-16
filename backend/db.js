import mysql from 'mysql2/promise';
// import sqlite3 from 'sqlite3';
// import { open } from 'sqlite';
import 'dotenv/config';

const DB_TYPE = process.env.DB_TYPE || 'sqlite';
const dbName = process.env.DB_NAME || 'bav_db';
const useSSL = process.env.DB_HOST && process.env.DB_HOST !== 'localhost';

let mysqlPool = null;
let sqliteDb = null;

if (DB_TYPE === 'mysql') {
  mysqlPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: dbName,
    multipleStatements: true,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ...(useSSL && { ssl: { rejectUnauthorized: false } })
  });
} else if (DB_TYPE === 'sqlite') {
  const sqlitePath = process.env.SQLITE_DB_PATH || './database.sqlite';
  try {
    const { default: sqlite3 } = await import('sqlite3');
    const { open } = await import('sqlite');
    sqliteDb = await open({
      filename: sqlitePath,
      driver: sqlite3.Database
    });
    // Enable foreign keys for sqlite
    await sqliteDb.exec('PRAGMA foreign_keys = ON;');
  } catch (err) {
    console.error('Failed to open SQLite database', err);
  }
}

const pool = {
  query: async (sql, params = []) => {
    if (DB_TYPE === 'mysql') {
      return mysqlPool.query(sql, params);
    } else if (DB_TYPE === 'sqlite') {
      const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
      if (isSelect) {
        const rows = await sqliteDb.all(sql, params);
        return [rows, null];
      } else {
        const result = await sqliteDb.run(sql, params);
        return [{ insertId: result.lastID, affectedRows: result.changes }, null];
      }
    }
  }
};

export default pool;
