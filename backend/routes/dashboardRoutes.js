import express from 'express';
import { getDashboardStats, getCountingGraphData } from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/stats', getDashboardStats);
router.get('/counting-graph', getCountingGraphData);

export default router;
