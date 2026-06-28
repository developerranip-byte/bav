import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import initializeDatabase from './db.js';
import categoryRoutes from './routes/categoryRoutes.js';
import languageRoutes from './routes/languageRoutes.js';
import itemRoutes from './routes/itemRoutes.js';

const app = express();
const PORT = process.env.PORT ?? 5000;

app.use(cors());
app.use(express.json());

const pool = await initializeDatabase();
app.locals.pool = pool;

app.use('/api/categories', categoryRoutes);
app.use('/api/languages', languageRoutes);
app.use('/api/items', itemRoutes);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
