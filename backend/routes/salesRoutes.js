import express from 'express';
import multer from 'multer';
import { getSales, createSale, exportSales, importSales } from '../controllers/salesController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/export', exportSales);
router.post('/import', upload.single('file'), importSales);
router.get('/', getSales);
router.post('/', createSale);

export default router;
