import express from 'express';
import { getPurchases, createPurchase } from '../controllers/purchaseController.js';

const router = express.Router();

router.get('/', getPurchases);
router.post('/', createPurchase);

export default router;
