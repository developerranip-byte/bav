import express from 'express';
import multer from 'multer';
import { getItems, searchItems, createItem, updateItem, deleteItem, exportItems, importItems, bulkDeleteItems } from '../controllers/itemController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/bulk-delete', bulkDeleteItems);
router.get('/export', exportItems);
router.post('/import', upload.single('file'), importItems);
router.get('/search', searchItems);
router.get('/', getItems);
router.post('/', createItem);
router.put('/:id', updateItem);
router.delete('/:id', deleteItem);

export default router;
