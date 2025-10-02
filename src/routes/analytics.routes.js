import express from 'express';
import {
  getRevenueAnalytics,
  getReaderAnalytics,
  getContentPerformance,
  getConversionFunnel,
  getTrafficSources,
  getDailyStats,
  getRealtimeActivity,
  getUserJourney,
  exportAnalytics
} from '../controllers/analytics.controller.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/revenue', authenticate, isAdmin, getRevenueAnalytics);
router.get('/readers', authenticate, isAdmin, getReaderAnalytics);
router.get('/content', authenticate, isAdmin, getContentPerformance);
router.get('/funnel', authenticate, isAdmin, getConversionFunnel);
router.get('/traffic', authenticate, isAdmin, getTrafficSources);
router.get('/daily', authenticate, isAdmin, getDailyStats);
router.get('/realtime', authenticate, isAdmin, getRealtimeActivity);
router.get('/journey', authenticate, isAdmin, getUserJourney);
router.get('/export', authenticate, isAdmin, exportAnalytics);

export default router;