import pool from '../db.js';
import bcrypt from 'bcrypt';

// Middleware to check if user is admin
export const requireAdmin = (req, res, next) => {
  if (req.user && (req.user.userType === 'super_admin' || req.user.userType === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Requires admin privileges' });
  }
};

export const getUsers = async (req, res) => {
  
  const [rows] = await pool.query('SELECT id, username, userType, isActive, modules, createdAt FROM users ORDER BY createdAt DESC');
  res.json(rows);
};

export const createUser = async (req, res) => {
  
  const { username, password, userType, modules = [] } = req.body;

  if (!username || !password || !userType) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const modulesJson = JSON.stringify(modules);
    const [result] = await pool.query(
      'INSERT INTO users (username, password, userType, modules) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, userType, modulesJson]
    );
    res.status(201).json({ id: result.insertId, username, userType, modules, isActive: 1 });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ message: 'Username already exists' });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const updateUser = async (req, res) => {
  
  const { id } = req.params;
  const { password, userType, isActive, modules } = req.body;

  try {
    const [userRows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if (userRows.length === 0) return res.status(404).json({ message: 'User not found' });
    const user = userRows[0];

    // Prevent non-super_admin from modifying super_admin
    if (user.userType === 'super_admin' && req.user.userType !== 'super_admin') {
      return res.status(403).json({ message: 'Cannot modify super admin' });
    }

    let query = 'UPDATE users SET ';
    const params = [];
    
    if (password) {
      query += 'password = ?, ';
      params.push(await bcrypt.hash(password, 10));
    }
    if (userType) {
      query += 'userType = ?, ';
      params.push(userType);
    }
    if (isActive !== undefined) {
      query += 'isActive = ?, ';
      params.push(isActive);
    }
    if (modules !== undefined) {
      query += 'modules = ?, ';
      params.push(JSON.stringify(modules));
    }

    query = query.slice(0, -2) + ' WHERE id = ?';
    params.push(id);

    await pool.query(query, params);
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};
