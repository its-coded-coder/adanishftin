import express from 'express';
import {
  requestPDFGeneration,
  getPDFs,
  getPDFDownload
} from '../controllers/pdf.controller.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/article/:articleId', authenticate, isAdmin, requestPDFGeneration);
router.get('/article/:articleId', getPDFs);
router.get('/:id/download', getPDFDownload);

export default router;