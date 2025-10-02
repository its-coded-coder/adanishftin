import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { sendWeeklyDigest } from './email.service.js';

const prisma = new PrismaClient();

export const startScheduledJobs = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('Running daily analytics aggregation...');
    await aggregateDailyStats();
  });

  cron.schedule('0 9 * * 1', async () => {
    console.log('Sending weekly digest emails...');
    await sendWeeklyDigest();
  });

  cron.schedule('0 */6 * * *', async () => {
    console.log('Updating conversion funnels...');
    await updateConversionFunnels();
  });

  console.log('Scheduled jobs started');
};

const aggregateDailyStats = async () => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const tomorrow = new Date(yesterday);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [views, sessions, comments, likes, shares, purchases, subscribers] = await Promise.all([
      prisma.articleView.count({
        where: {
          viewedAt: {
            gte: yesterday,
            lt: tomorrow
          }
        }
      }),
      prisma.userSession.count({
        where: {
          startedAt: {
            gte: yesterday,
            lt: tomorrow
          }
        }
      }),
      prisma.comment.count({
        where: {
          createdAt: {
            gte: yesterday,
            lt: tomorrow
          }
        }
      }),
      prisma.articleLike.count({
        where: {
          createdAt: {
            gte: yesterday,
            lt: tomorrow
          }
        }
      }),
      prisma.share.count({
        where: {
          createdAt: {
            gte: yesterday,
            lt: tomorrow
          }
        }
      }),
      prisma.purchase.aggregate({
        where: {
          createdAt: {
            gte: yesterday,
            lt: tomorrow
          },
          status: 'COMPLETED'
        },
        _sum: { amount: true },
        _count: true
      }),
      prisma.newsletterSubscriber.count({
        where: {
          subscribedAt: {
            gte: yesterday,
            lt: tomorrow
          }
        }
      })
    ]);

    const uniqueViewsCount = await prisma.articleView.groupBy({
      by: ['userId', 'ipAddress'],
      where: {
        viewedAt: {
          gte: yesterday,
          lt: tomorrow
        }
      }
    });

    const avgTimeSpent = await prisma.articleView.aggregate({
      where: {
        viewedAt: {
          gte: yesterday,
          lt: tomorrow
        },
        timeSpent: { not: null }
      },
      _avg: { timeSpent: true }
    });

    const avgScrollDepth = await prisma.articleView.aggregate({
      where: {
        viewedAt: {
          gte: yesterday,
          lt: tomorrow
        },
        scrollDepth: { not: null }
      },
      _avg: { scrollDepth: true }
    });

    await prisma.dailyStats.upsert({
      where: { date: yesterday },
      update: {
        views,
        uniqueViews: uniqueViewsCount.length,
        sessions,
        comments,
        likes,
        shares,
        purchases: purchases._count,
        revenue: purchases._sum.amount || 0,
        newSubscribers: subscribers,
        avgTimeSpent: Math.round(avgTimeSpent._avg.timeSpent || 0),
        avgScrollDepth: avgScrollDepth._avg.scrollDepth || 0
      },
      create: {
        date: yesterday,
        views,
        uniqueViews: uniqueViewsCount.length,
        sessions,
        comments,
        likes,
        shares,
        purchases: purchases._count,
        revenue: purchases._sum.amount || 0,
        newSubscribers: subscribers,
        avgTimeSpent: Math.round(avgTimeSpent._avg.timeSpent || 0),
        avgScrollDepth: avgScrollDepth._avg.scrollDepth || 0
      }
    });

    console.log('Daily stats aggregated successfully');
  } catch (error) {
    console.error('Error aggregating daily stats:', error);
  }
};

const updateConversionFunnels = async () => {
  try {
    const articles = await prisma.article.findMany({
      where: { status: 'PUBLISHED' }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const article of articles) {
      const [views, uniqueViews, liked, commented, shared, purchases] = await Promise.all([
        prisma.articleView.count({
          where: {
            articleId: article.id,
            viewedAt: {
              gte: today
            }
          }
        }),
        prisma.articleView.groupBy({
          by: ['userId', 'ipAddress'],
          where: {
            articleId: article.id,
            viewedAt: {
              gte: today
            }
          }
        }),
        prisma.articleLike.count({
          where: {
            articleId: article.id,
            createdAt: {
              gte: today
            }
          }
        }),
        prisma.comment.count({
          where: {
            articleId: article.id,
            createdAt: {
              gte: today
            }
          }
        }),
        prisma.share.count({
          where: {
            articleId: article.id,
            createdAt: {
              gte: today
            }
          }
        }),
        prisma.purchase.aggregate({
          where: {
            articleId: article.id,
            createdAt: {
              gte: today
            },
            status: 'COMPLETED'
          },
          _sum: { amount: true },
          _count: true
        })
      ]);

      await prisma.conversionFunnel.upsert({
        where: {
          articleId_date: {
            articleId: article.id,
            date: today
          }
        },
        update: {
          views,
          uniqueViews: uniqueViews.length,
          liked,
          commented,
          shared,
          purchases: purchases._count,
          revenue: purchases._sum.amount || 0
        },
        create: {
          articleId: article.id,
          date: today,
          views,
          uniqueViews: uniqueViews.length,
          liked,
          commented,
          shared,
          purchases: purchases._count,
          revenue: purchases._sum.amount || 0
        }
      });
    }

    console.log('Conversion funnels updated successfully');
  } catch (error) {
    console.error('Error updating conversion funnels:', error);
  }
};