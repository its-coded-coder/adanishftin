import express from 'express';
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
  approveComment,
  likeComment,
  getAllComments
} from '../controllers/comment.controller.js';
import { authenticate, isAdmin, optionalAuthenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/all', authenticate, isAdmin, getAllComments);
router.get('/article/:articleId', optionalAuthenticate, getComments);
router.post('/article/:articleId', optionalAuthenticate, createComment);
router.put('/:id', authenticate, updateComment);
router.delete('/:id', authenticate, deleteComment);
router.post('/:id/approve', authenticate, isAdmin, approveComment);
router.post('/:id/like', optionalAuthenticate, likeComment);

export default router;