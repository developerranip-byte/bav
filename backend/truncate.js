import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const truncateDatabase = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bav_db',
    multipleStatements: true,
  });

  try {
    console.log('Connecting to database to truncate tables...');
    
    // Disable foreign key checks to allow truncating tables with relationships
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    
    const tablesToTruncate = [
      'sales',
      'purchases',
      'items',
      'categories',
      'languages',
      // Note: Truncating 'users' will remove all accounts. The backend will re-create 
      // the default 'admin' account upon the next server restart via db.js
      'users' 
    ];

    for (const table of tablesToTruncate) {
      console.log(`Truncating ${table}...`);
      await connection.query(`TRUNCATE TABLE \`${table}\``);
    }

    // Re-enable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('Successfully truncated all tables!');
  } catch (error) {
    console.error('Error truncating tables:', error);
  } finally {
    await connection.end();
    process.exit(0);
  }
};

truncateDatabase();
