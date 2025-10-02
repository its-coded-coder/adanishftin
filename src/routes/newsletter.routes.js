import express from 'express';
import {
  subscribe,
  unsubscribe,
  getSubscribers,
  createCampaign,
  getCampaigns
} from '../controllers/newsletter.controller.js';
import { authenticate, isAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  subscribeSchema,
  unsubscribeSchema,
  campaignSchema
} from '../validations/newsletter.validation.js';

const router = express.Router();

router.post('/subscribe', validate(subscribeSchema), subscribe);
router.post('/unsubscribe', validate(unsubscribeSchema), unsubscribe);
router.get('/subscribers', authenticate, isAdmin, getSubscribers);
router.post('/campaign', authenticate, isAdmin, validate(campaignSchema), createCampaign);
router.get('/campaigns', authenticate, isAdmin, getCampaigns);

export default router;