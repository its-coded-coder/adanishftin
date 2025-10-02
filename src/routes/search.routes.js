import express from 'express';
import {
  search,
  popularSearches,
  searchSuggestions
} from '../controllers/search.controller.js';
import { optionalAuthenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', optionalAuthenticate, search);
router.get('/popular', popularSearches);
router.get('/suggestions', searchSuggestions);

export default router;