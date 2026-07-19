import 'dotenv/config';
import pool from './db.js';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';

const seedUsers = async () => {
  console.log(`Starting to seed users...`);
  const connection = pool;

  try {
    console.log('Clearing existing data from users table...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('TRUNCATE TABLE users');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    
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
    throw err;
  }
};

export default seedUsers;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedUsers().then(async () => {
    await pool.end();
    process.exit(0);
  }).catch(async () => {
    await pool.end();
    process.exit(1);
  });
}
