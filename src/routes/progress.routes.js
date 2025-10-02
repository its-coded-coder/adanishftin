import express from 'express';
import {
  getProgress,
  updateProgress,
  getAllProgress,
  deleteProgress
} from '../controllers/progress.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getAllProgress);
router.get('/:articleId', authenticate, getProgress);
router.put('/:articleId', authenticate, updateProgress);
router.delete('/:articleId', authenticate, deleteProgress);

export default router;