import mysql from 'mysql2/promise';
import 'dotenv/config';

const dbName = process.env.DB_NAME || 'bav_db';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: dbName,
  multipleStatements: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
