import express from 'express';
import {
  getProfile,
  updateProfile,
  getBookmarks,
  addBookmark,
  removeBookmark,
  getPurchases
} from '../controllers/profile.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getProfile);
router.put('/', authenticate, updateProfile);
router.get('/bookmarks', authenticate, getBookmarks);
router.post('/bookmarks/:articleId', authenticate, addBookmark);
router.delete('/bookmarks/:articleId', authenticate, removeBookmark);
router.get('/purchases', authenticate, getPurchases);

export default router;