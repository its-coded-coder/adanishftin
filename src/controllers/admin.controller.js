import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getStats = async (req, res, next) => {
  try {
    const [
      totalArticles,
      draftArticles,
      stagingArticles,
      publishedArticles,
      totalUsers,
      totalSubscribers,
      activeSubscribers,
      totalRevenue,
      recentPurchases
    ] = await Promise.all([
      prisma.article.count(),
      prisma.article.count({ where: { status: 'DRAFT' } }),
      prisma.article.count({ where: { status: 'STAGING' } }),
      prisma.article.count({ where: { status: 'PUBLISHED' } }),
      prisma.user.count(),
      prisma.newsletterSubscriber.count(),
      prisma.newsletterSubscriber.count({ where: { isActive: true } }),
      prisma.purchase.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true }
      }),
      prisma.purchase.count({
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    res.json({
      articles: {
        total: totalArticles,
        draft: draftArticles,
        staging: stagingArticles,
        published: publishedArticles
      },
      users: {
        total: totalUsers
      },
      newsletter: {
        total: totalSubscribers,
        active: activeSubscribers
      },
      revenue: {
        total: totalRevenue._sum.amount || 0,
        recentPurchases
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAllArticles = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = status ? { status } : {};

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: { id: true, name: true, email: true }
          },
          tags: true,
          _count: {
            select: { 
              bookmarks: true,
              purchases: true
            }
          }
        }
      }),
      prisma.article.count({ where })
    ]);

    res.json({
      articles,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              articles: true,
              bookmarks: true,
              purchases: true
            }
          }
        }
      }),
      prisma.user.count()
    ]);

    res.json({
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
};