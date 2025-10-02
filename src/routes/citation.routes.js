import express from 'express';
import {
  getCitations,
  createCitation,
  updateCitation,
  deleteCitation,
  exportCitations
} from '../controllers/citation.controller.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/article/:articleId', getCitations);
router.get('/article/:articleId/export', exportCitations);
router.post('/article/:articleId', authenticate, isAdmin, createCitation);
router.put('/:id', authenticate, isAdmin, updateCitation);
router.delete('/:id', authenticate, isAdmin, deleteCitation);

export default router;