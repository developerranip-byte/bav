import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import initializeDatabase from './db.js';
import categoryRoutes from './routes/categoryRoutes.js';
import languageRoutes from './routes/languageRoutes.js';
import itemRoutes from './routes/itemRoutes.js';
import purchaseRoutes from './routes/purchaseRoutes.js';
import salesRoutes from './routes/salesRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { verifyToken } from './controllers/authController.js';

const app = express();
const PORT = process.env.PORT ?? 5000; 

app.use(cors());
app.use(express.json());

const pool = await initializeDatabase(); 
app.locals.pool = pool; 

app.use('/api/auth', authRoutes);

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token || !verifyToken(token)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};

app.use('/api/categories', authMiddleware, categoryRoutes);
app.use('/api/languages', authMiddleware, languageRoutes);
app.use('/api/items', authMiddleware, itemRoutes);
app.use('/api/purchases', authMiddleware, purchaseRoutes);
app.use('/api/sales', authMiddleware, salesRoutes);
app.use('/api/reports', authMiddleware, reportRoutes);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`); 
});
