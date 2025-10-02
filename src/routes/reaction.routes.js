import express from 'express';
import {
  likeArticle,
  reactToArticle,
  getArticleReactions,
  shareArticle,
  getShareStats
} from '../controllers/reaction.controller.js';
import { optionalAuthenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/article/:articleId/like', optionalAuthenticate, likeArticle);
router.post('/article/:articleId/react', optionalAuthenticate, reactToArticle);
router.get('/article/:articleId/reactions', getArticleReactions);
router.post('/article/:articleId/share', optionalAuthenticate, shareArticle);
router.get('/article/:articleId/shares', getShareStats);

export default router;