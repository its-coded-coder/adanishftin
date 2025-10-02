import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getEmailSubscription,
  updateEmailSubscription
} from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getNotifications);
router.patch('/:id/read', authenticate, markAsRead);
router.patch('/read-all', authenticate, markAllAsRead);
router.delete('/:id', authenticate, deleteNotification);
router.get('/email-subscription', authenticate, getEmailSubscription);
router.put('/email-subscription', authenticate, updateEmailSubscription);

export default router;