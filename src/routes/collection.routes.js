import express from 'express';
import {
  listCollections,
  getCollection,
  createCollection,
  updateCollection,
  deleteCollection,
  addArticleToCollection,
  removeArticleFromCollection,
  updateArticleOrder
} from '../controllers/collection.controller.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', listCollections);
router.get('/:slug', getCollection);
router.post('/', authenticate, isAdmin, createCollection);
router.put('/:id', authenticate, isAdmin, updateCollection);
router.delete('/:id', authenticate, isAdmin, deleteCollection);
router.post('/:collectionId/articles/:articleId', authenticate, isAdmin, addArticleToCollection);
router.delete('/:collectionId/articles/:articleId', authenticate, isAdmin, removeArticleFromCollection);
router.patch('/:collectionId/articles/:articleId/order', authenticate, isAdmin, updateArticleOrder);

export default router;