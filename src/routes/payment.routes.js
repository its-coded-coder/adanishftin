import express from 'express';
import {
  createPaymentIntent,
  confirmPayment,
  getPaymentHistory,
  webhookHandler
} from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/create-intent', authenticate, createPaymentIntent);
router.post('/confirm', authenticate, confirmPayment);
router.get('/history', authenticate, getPaymentHistory);
router.post('/webhook', express.raw({ type: 'application/json' }), webhookHandler);

export default router;