import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { ROLE_MODULES } from '../config/roles.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_bav_key';

export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ? AND isActive = 1', [username]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    let modules = ROLE_MODULES[user.userType] || [];
    if (user.modules && user.userType !== 'super_admin') {
      try {
        modules = typeof user.modules === 'string' ? JSON.parse(user.modules) : user.modules;
      } catch (e) {
        console.error('Failed to parse user modules', e);
      }
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, userType: user.userType, modules },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: user.username, userType: user.userType, modules });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const logout = (req, res) => {
  res.status(204).end();
};
