import express from 'express';
import { createCountingEntry, getCountingEntries, updateCountingEntry, deleteCountingEntry } from '../controllers/countingController.js';

const router = express.Router();

router.post('/', createCountingEntry);
router.get('/', getCountingEntries);
router.put('/:id', updateCountingEntry);
router.delete('/:id', deleteCountingEntry);

export default router;
