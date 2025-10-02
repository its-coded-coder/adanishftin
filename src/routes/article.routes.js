import express from 'express';
import {
  listArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  updateArticleStatus,
  getArticleMedia
} from '../controllers/article.controller.js';
import { uploadMedia, deleteMedia, getPresignedUrl } from '../controllers/media.controller.js';
import { authenticate, isAdmin, optionalAuthenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createArticleSchema,
  updateArticleSchema,
  statusSchema
} from '../validations/article.validation.js';
import { upload } from '../config/multer.js';

const router = express.Router();

router.get('/', optionalAuthenticate, listArticles);
router.get('/:slug', optionalAuthenticate, getArticle);
router.get('/:id/media', getArticleMedia);

router.post('/', authenticate, isAdmin, validate(createArticleSchema), createArticle);
router.put('/:id', authenticate, isAdmin, validate(updateArticleSchema), updateArticle);
router.delete('/:id', authenticate, isAdmin, deleteArticle);
router.patch('/:id/status', authenticate, isAdmin, validate(statusSchema), updateArticleStatus);

router.post('/:articleId/media', authenticate, isAdmin, upload.single('file'), uploadMedia);
router.delete('/media/:id', authenticate, isAdmin, deleteMedia);
router.get('/media/:id/url', getPresignedUrl);

export default router;