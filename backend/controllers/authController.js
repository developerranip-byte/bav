import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ROLE_MODULES } from '../config/roles.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_bav_key';

export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findByUsernameActive(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    let modules = ROLE_MODULES[user.userType] || [];
    if (user.modules && user.userType !== 'super_admin') {
      try {
        const parsedModules = typeof user.modules === 'string' ? JSON.parse(user.modules) : user.modules;
        if (Array.isArray(parsedModules) && parsedModules.length > 0) {
          modules = parsedModules;
        }
      } catch (e) {
        console.error('Failed to parse user modules', e);
      }
    }
    let userCenters = [];
    if (user.centers) {
      try {
        const parsedCenters = typeof user.centers === 'string' ? JSON.parse(user.centers) : user.centers;
        if (Array.isArray(parsedCenters)) {
          userCenters = parsedCenters;
        }
      } catch (e) {
        console.error('Failed to parse user centers', e);
      }
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, userType: user.userType, modules, centers: userCenters },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: user.username, userType: user.userType, modules, centers: userCenters });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const logout = (req, res) => {
  res.status(204).end();
};
