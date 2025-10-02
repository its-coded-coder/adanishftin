import express from 'express';
import {
  getStats,
  getAllArticles,
  getAllUsers
} from '../controllers/admin.controller.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', authenticate, isAdmin, getStats);
router.get('/articles', authenticate, isAdmin, getAllArticles);
router.get('/users', authenticate, isAdmin, getAllUsers);

export default router;