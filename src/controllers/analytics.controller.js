import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getRevenueAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate, articleId } = req.query;

    const where = {};
    if (startDate && endDate) {
      where.purchasedAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }
    if (articleId) {
      where.articleId = articleId;
    }

    const [totalRevenue, revenueByArticle, revenueByDay] = await Promise.all([
      prisma.revenueAnalytics.aggregate({
        where,
        _sum: {
          netRevenue: true,
          stripeFee: true
        },
        _count: true
      }),
      prisma.revenueAnalytics.groupBy({
        by: ['articleId'],
        where,
        _sum: {
          netRevenue: true
        },
        _count: true
      }),
      prisma.revenueAnalytics.groupBy({
        by: ['purchasedAt'],
        where,
        _sum: {
          netRevenue: true
        }
      })
    ]);

    res.json({
      totalRevenue: totalRevenue._sum.netRevenue || 0,
      totalFees: totalRevenue._sum.stripeFee || 0,
      totalTransactions: totalRevenue._count,
      byArticle: revenueByArticle,
      byDay: revenueByDay
    });
  } catch (error) {
    next(error);
  }
};

export const getReaderAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate && endDate) {
      where.lastVisit = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const [totalReaders, readerSegments, topReaders] = await Promise.all([
      prisma.readerBehavior.count({ where }),
      prisma.readerBehavior.groupBy({
        by: ['returningVisitor'],
        where,
        _count: true
      }),
      prisma.readerBehavior.findMany({
        where,
        orderBy: { totalSpent: 'desc' },
        take: 10,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })
    ]);

    res.json({
      totalReaders,
      newVisitors: readerSegments.find(s => !s.returningVisitor)?._count || 0,
      returningVisitors: readerSegments.find(s => s.returningVisitor)?._count || 0,
      topReaders
    });
  } catch (error) {
    next(error);
  }
};

export const getContentPerformance = async (req, res, next) => {
  try {
    const { period = 'week', limit = 10 } = req.query;

    let startDate = new Date();
    if (period === 'day') {
      startDate.setDate(startDate.getDate() - 1);
    } else if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    const whereClause = {
      status: 'PUBLISHED',
      OR: [
        {
          publishedAt: {
            gte: startDate
          }
        },
        {
          publishedAt: null,
          createdAt: {
            gte: startDate
          }
        }
      ]
    };

    const topArticles = await prisma.article.findMany({
      where: whereClause,
      orderBy: [
        { views: 'desc' },
        { likes: 'desc' }
      ],
      take: parseInt(limit),
      include: {
        author: {
          select: { id: true, name: true }
        },
        _count: {
          select: {
            comments: true,
            articleLikes: true,
            shareRecords: true,
            purchases: true
          }
        }
      }
    });

    res.json({ topArticles });
  } catch (error) {
    console.error('Content performance error:', error);
    next(error);
  }
};

export const getConversionFunnel = async (req, res, next) => {
  try {
    const { articleId, startDate, endDate } = req.query;

    const where = { articleId };
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const funnels = await prisma.conversionFunnel.findMany({
      where,
      orderBy: { date: 'desc' }
    });

    const totals = funnels.reduce((acc, f) => ({
      views: acc.views + f.views,
      scrolled50: acc.scrolled50 + f.scrolled50,
      scrolled75: acc.scrolled75 + f.scrolled75,
      completed: acc.completed + f.completed,
      liked: acc.liked + f.liked,
      commented: acc.commented + f.commented,
      shared: acc.shared + f.shared,
      purchases: acc.purchases + f.purchases,
      revenue: acc.revenue + f.revenue
    }), {
      views: 0,
      scrolled50: 0,
      scrolled75: 0,
      completed: 0,
      liked: 0,
      commented: 0,
      shared: 0,
      purchases: 0,
      revenue: 0
    });

    res.json({ funnels, totals });
  } catch (error) {
    next(error);
  }
};

export const getTrafficSources = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const sources = await prisma.trafficSource.groupBy({
      by: ['source', 'medium'],
      where,
      _sum: {
        sessions: true,
        pageViews: true,
        revenue: true
      }
    });

    res.json({ sources });
  } catch (error) {
    next(error);
  }
};

export const getDailyStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const stats = await prisma.dailyStats.findMany({
      where,
      orderBy: { date: 'desc' }
    });

    res.json({ stats });
  } catch (error) {
    next(error);
  }
};

export const getRealtimeActivity = async (req, res, next) => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const [activeViews, recentPurchases, recentComments] = await Promise.all([
      prisma.articleView.count({
        where: {
          viewedAt: { gte: fiveMinutesAgo }
        }
      }),
      prisma.purchase.count({
        where: {
          createdAt: { gte: fiveMinutesAgo },
          status: 'COMPLETED'
        }
      }),
      prisma.comment.count({
        where: {
          createdAt: { gte: fiveMinutesAgo }
        }
      })
    ]);

    res.json({
      activeReaders: activeViews,
      recentPurchases,
      recentComments,
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
};

export const getUserJourney = async (req, res, next) => {
  try {
    const { sessionId, userId } = req.query;

    const where = {};
    if (sessionId) where.sessionId = sessionId;
    if (userId) where.userId = userId;

    const journey = await prisma.userJourney.findMany({
      where,
      orderBy: { step: 'asc' },
      include: {
        article: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        }
      }
    });

    res.json({ journey });
  } catch (error) {
    next(error);
  }
};

export const exportAnalytics = async (req, res, next) => {
  try {
    const { type, startDate, endDate } = req.query;

    let data;
    const where = {};
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    switch (type) {
      case 'views':
        data = await prisma.articleView.findMany({ where });
        break;
      case 'purchases':
        data = await prisma.purchase.findMany({ where });
        break;
      case 'comments':
        data = await prisma.comment.findMany({ where });
        break;
      default:
        return res.status(400).json({ error: 'Invalid export type' });
    }

    res.json({ data });
  } catch (error) {
    next(error);
  }
};