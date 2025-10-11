import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const calculateRelatedArticles = async (articleId) => {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: { tags: true }
  });

  if (!article) {
    throw new Error('Article not found');
  }

  const allArticles = await prisma.article.findMany({
    where: {
      status: 'PUBLISHED',
      id: { not: articleId }
    },
    include: { tags: true }
  });

  const scores = allArticles.map(otherArticle => {
    let score = 0;

    const articleTags = article.tags.map(t => t.slug);
    const otherTags = otherArticle.tags.map(t => t.slug);
    const commonTags = articleTags.filter(tag => otherTags.includes(tag));
    score += commonTags.length * 3;

    const articleKeywords = article.keywords?.toLowerCase().split(',').map(k => k.trim()) || [];
    const otherKeywords = otherArticle.keywords?.toLowerCase().split(',').map(k => k.trim()) || [];
    const commonKeywords = articleKeywords.filter(kw => otherKeywords.includes(kw));
    score += commonKeywords.length * 2;

    if (article.authorId === otherArticle.authorId) {
      score += 1;
    }

    const titleWords = article.title.toLowerCase().split(' ').filter(w => w.length > 3);
    const otherTitleWords = otherArticle.title.toLowerCase().split(' ').filter(w => w.length > 3);
    const commonTitleWords = titleWords.filter(w => otherTitleWords.includes(w));
    score += commonTitleWords.length * 1.5;

    return {
      articleId: otherArticle.id,
      score
    };
  });

  const topRelated = scores
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  await prisma.relatedArticle.deleteMany({
    where: { articleId }
  });

  if (topRelated.length > 0) {
    await prisma.relatedArticle.createMany({
      data: topRelated.map(r => ({
        articleId,
        relatedArticleId: r.articleId,
        score: r.score
      }))
    });
  }

  return topRelated;
};

export const getRelatedArticles = async (articleId, limit = 5) => {
  let related = await prisma.relatedArticle.findMany({
    where: { articleId },
    take: limit,
    orderBy: { score: 'desc' },
    include: {
      relatedArticle: {
        include: {
          author: {
            select: { id: true, name: true }
          },
          tags: true
        }
      }
    }
  });

  if (related.length === 0) {
    await calculateRelatedArticles(articleId);
    
    related = await prisma.relatedArticle.findMany({
      where: { articleId },
      take: limit,
      orderBy: { score: 'desc' },
      include: {
        relatedArticle: {
          include: {
            author: {
              select: { id: true, name: true }
            },
            tags: true
          }
        }
      }
    });
  }

  return related.map(r => r.relatedArticle);
};