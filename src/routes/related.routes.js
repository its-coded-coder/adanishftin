import express from 'express';
import {
  getRelated,
  recalculateRelated
} from '../controllers/related.controller.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/article/:articleId', getRelated);
router.post('/article/:articleId/recalculate', authenticate, isAdmin, recalculateRelated);

export default router;