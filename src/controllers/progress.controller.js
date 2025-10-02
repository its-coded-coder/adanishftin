import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getProgress = async (req, res, next) => {
  try {
    const { articleId } = req.params;

    const progress = await prisma.readingProgress.findUnique({
      where: {
        userId_articleId: {
          userId: req.user.id,
          articleId
        }
      }
    });

    res.json(progress || { progress: 0 });
  } catch (error) {
    next(error);
  }
};

export const updateProgress = async (req, res, next) => {
  try {
    const { articleId } = req.params;
    const { progress } = req.body;

    const readingProgress = await prisma.readingProgress.upsert({
      where: {
        userId_articleId: {
          userId: req.user.id,
          articleId
        }
      },
      update: {
        progress
      },
      create: {
        userId: req.user.id,
        articleId,
        progress
      }
    });

    res.json(readingProgress);
  } catch (error) {
    next(error);
  }
};

export const getAllProgress = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [progressList, total] = await Promise.all([
      prisma.readingProgress.findMany({
        where: { userId: req.user.id },
        skip,
        take: limitNum,
        orderBy: { lastReadAt: 'desc' },
        include: {
          article: {
            select: {
              id: true,
              title: true,
              slug: true,
              coverImage: true,
              excerpt: true
            }
          }
        }
      }),
      prisma.readingProgress.count({ where: { userId: req.user.id } })
    ]);

    res.json({
      progress: progressList,
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

export const deleteProgress = async (req, res, next) => {
  try {
    const { articleId } = req.params;

    await prisma.readingProgress.delete({
      where: {
        userId_articleId: {
          userId: req.user.id,
          articleId
        }
      }
    });

    res.json({ message: 'Progress deleted' });
  } catch (error) {
    next(error);
  }
};