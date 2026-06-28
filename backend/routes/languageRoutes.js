import express from 'express';
import { getLanguages, createLanguage } from '../controllers/languageController.js';

const router = express.Router();

router.get('/', getLanguages);
router.post('/', createLanguage);

export default router;
