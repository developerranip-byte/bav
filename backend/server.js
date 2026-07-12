import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pool from './db.js';
import initDB from './initDB.js';
import categoryRoutes from './routes/categoryRoutes.js';
import languageRoutes from './routes/languageRoutes.js';
import itemRoutes from './routes/itemRoutes.js';
import purchaseRoutes from './routes/purchaseRoutes.js';
import salesRoutes from './routes/salesRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './controllers/authController.js';

const app = express();
const PORT = process.env.PORT ?? 5000;

app.use(cors());
app.use(express.json());

app.locals.pool = pool;

app.get('/api/init-db', async (req, res) => {
  try {
    await initDB();
    res.json({ message: 'Database initialization completed successfully.' });
  } catch (error) {
    console.error('Init DB Error:', error);
    res.status(500).json({ message: 'Database initialization failed.', error: error.message });
  }
});

app.use('/api/auth', authRoutes);

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

app.use('/api/categories', authMiddleware, categoryRoutes);
app.use('/api/languages', authMiddleware, languageRoutes);
app.use('/api/items', authMiddleware, itemRoutes);
app.use('/api/purchases', authMiddleware, purchaseRoutes);
app.use('/api/sales', authMiddleware, salesRoutes);
app.use('/api/reports', authMiddleware, reportRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}

export default app;
