import express from 'express';
import multer from 'multer';
import { getPurchases, createPurchase, exportPurchases, importPurchases } from '../controllers/purchaseController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/export', exportPurchases);
router.post('/import', upload.single('file'), importPurchases);
router.get('/', getPurchases);
router.post('/', createPurchase);

export default router;
