import express from 'express';
import { getItemReports, getItemPurchaseHistory, getItemSalesHistory } from '../controllers/reportController.js';

const router = express.Router();

router.get('/', getItemReports);
router.get('/:id/purchases', getItemPurchaseHistory);
router.get('/:id/sales', getItemSalesHistory);

export default router;
