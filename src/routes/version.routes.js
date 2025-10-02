import express from 'express';
import {
  createVersion,
  getVersions,
  getVersion,
  restoreVersion
} from '../controllers/version.controller.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/article/:articleId', getVersions);
router.get('/:id', getVersion);
router.post('/article/:articleId', authenticate, isAdmin, createVersion);
router.post('/:id/restore', authenticate, isAdmin, restoreVersion);

export default router;