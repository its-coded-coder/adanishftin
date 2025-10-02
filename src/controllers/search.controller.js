import { advancedSearch, logSearchQuery, getPopularSearches, getSuggestions } from '../services/search.service.js';

export const search = async (req, res, next) => {
  try {
    const result = await advancedSearch(req.query);
    
    await logSearchQuery(
      req.query.query || '',
      req.query,
      result.articles.length,
      req.user?.id
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const popularSearches = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const searches = await getPopularSearches(parseInt(limit));
    res.json({ searches });
  } catch (error) {
    next(error);
  }
};

export const searchSuggestions = async (req, res, next) => {
  try {
    const { q } = req.query;
    const suggestions = await getSuggestions(q);
    res.json(suggestions);
  } catch (error) {
    next(error);
  }
};