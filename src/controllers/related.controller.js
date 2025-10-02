import { getRelatedArticles, calculateRelatedArticles } from '../services/related.service.js';

export const getRelated = async (req, res, next) => {
  try {
    const { articleId } = req.params;
    const { limit = 5 } = req.query;

    const articles = await getRelatedArticles(articleId, parseInt(limit));
    res.json({ articles });
  } catch (error) {
    next(error);
  }
};

export const recalculateRelated = async (req, res, next) => {
  try {
    const { articleId } = req.params;

    await calculateRelatedArticles(articleId);
    const articles = await getRelatedArticles(articleId);
    
    res.json({ 
      message: 'Related articles recalculated',
      articles 
    });
  } catch (error) {
    next(error);
  }
};