import 'dotenv/config';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

const seedUsers = async () => {
  const dbName = process.env.DB_NAME || 'bav_db';
  console.log(`Connecting to database "${dbName}" at ${process.env.DB_HOST || 'localhost'}...`);

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: dbName,
  });

  try {
    console.log('Clearing existing data from users table...');
    // We don't disable foreign key checks here since 'users' doesn't have foreign keys pointing to it that would block truncation
    await connection.query('TRUNCATE TABLE users');
    
    console.log('Inserting default users...');
    const hashedSuperAdmin = await bcrypt.hash('superadmin', 10);
    const hashedAdmin = await bcrypt.hash('admin', 10);
    const hashedUser = await bcrypt.hash('user', 10);

    const users = [
      ['superadmin', hashedSuperAdmin, 'super_admin', 1, null],
      ['admin', hashedAdmin, 'admin', 1, null],
      ['testuser', hashedUser, 'user', 1, null]
    ];

    for (const u of users) {
      await connection.query(
        'INSERT INTO users (username, password, userType, isActive, modules) VALUES (?, ?, ?, ?, ?)',
        u
      );
    }
    console.log('Successfully inserted default users:');
    console.log('- superadmin (Role: super_admin)');
    console.log('- admin (Role: admin)');
    console.log('- testuser (Role: user)');

  } catch (err) {
    console.error('Error seeding users:', err);
  } finally {
    await connection.end();
    process.exit(0);
  }
};

seedUsers();
