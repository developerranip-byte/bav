import express from 'express';
import { getUsers, createUser, updateUser, requireAdmin } from '../controllers/userController.js';

const router = express.Router();

router.use(requireAdmin); // Protect all user routes

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);

export default router;
