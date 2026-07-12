import mysql from 'mysql2/promise';
import 'dotenv/config';

const dbName = process.env.DB_NAME || 'bav_db';

const useSSL = process.env.DB_HOST && process.env.DB_HOST !== 'localhost';

const pool = mysql.createPool({
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

export default pool;
