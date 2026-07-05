import crypto from 'crypto';

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin';
const validTokens = new Set();

export const login = (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = crypto.randomBytes(32).toString('hex');
    validTokens.add(token);
    return res.json({ token, user: ADMIN_USERNAME });
  }
  return res.status(401).json({ message: 'Invalid username or password' });
};

export const logout = (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (token) {
    validTokens.delete(token);
  }
  res.status(204).end();
};

export const verifyToken = (token) => validTokens.has(token);
