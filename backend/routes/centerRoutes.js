import express from 'express';
import { getCenters, createCenter, updateCenter, deleteCenter } from '../controllers/centerController.js';

const router = express.Router();

router.get('/', getCenters);
router.post('/', createCenter);
router.put('/:id', updateCenter);
router.delete('/:id', deleteCenter);

export default router;
