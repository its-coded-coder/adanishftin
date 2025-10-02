import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const likeArticle = async (req, res, next) => {
  try {
    const { articleId } = req.params;
    const ipAddress = req.ip;

    const article = await prisma.article.findUnique({
      where: { id: articleId }
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const existingLike = await prisma.articleLike.findFirst({
      where: {
        articleId,
        OR: [
          { userId: req.user?.id },
          { ipAddress }
        ]
      }
    });

    if (existingLike) {
      await prisma.articleLike.delete({
        where: { id: existingLike.id }
      });

      await prisma.article.update({
        where: { id: articleId },
        data: { likes: { decrement: 1 } }
      });

      return res.json({ liked: false, likes: article.likes - 1 });
    }

    await prisma.articleLike.create({
      data: {
        articleId,
        userId: req.user?.id,
        ipAddress: req.user ? null : ipAddress
      }
    });

    await prisma.article.update({
      where: { id: articleId },
      data: { likes: { increment: 1 } }
    });

    res.json({ liked: true, likes: article.likes + 1 });
  } catch (error) {
    next(error);
  }
};

export const reactToArticle = async (req, res, next) => {
  try {
    const { articleId } = req.params;
    const { type } = req.body;
    const ipAddress = req.ip;

    const article = await prisma.article.findUnique({
      where: { id: articleId }
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const existingReaction = await prisma.articleReaction.findFirst({
      where: {
        articleId,
        type,
        OR: [
          { userId: req.user?.id },
          { ipAddress }
        ]
      }
    });

    if (existingReaction) {
      await prisma.articleReaction.delete({
        where: { id: existingReaction.id }
      });

      return res.json({ reacted: false, type });
    }

    await prisma.articleReaction.create({
      data: {
        articleId,
        type,
        userId: req.user?.id,
        ipAddress: req.user ? null : ipAddress
      }
    });

    res.json({ reacted: true, type });
  } catch (error) {
    next(error);
  }
};

export const getArticleReactions = async (req, res, next) => {
  try {
    const { articleId } = req.params;

    const reactions = await prisma.articleReaction.groupBy({
      by: ['type'],
      where: { articleId },
      _count: { type: true }
    });

    const reactionCounts = reactions.reduce((acc, r) => {
      acc[r.type] = r._count.type;
      return acc;
    }, {});

    res.json(reactionCounts);
  } catch (error) {
    next(error);
  }
};

export const shareArticle = async (req, res, next) => {
  try {
    const { articleId } = req.params;
    const { platform } = req.body;

    const article = await prisma.article.findUnique({
      where: { id: articleId }
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    await prisma.share.create({
      data: {
        articleId,
        platform,
        userId: req.user?.id
      }
    });

    await prisma.article.update({
      where: { id: articleId },
      data: { shares: { increment: 1 } }
    });

    res.json({ message: 'Share recorded' });
  } catch (error) {
    next(error);
  }
};

export const getShareStats = async (req, res, next) => {
  try {
    const { articleId } = req.params;

    const shares = await prisma.share.groupBy({
      by: ['platform'],
      where: { articleId },
      _count: { platform: true }
    });

    const shareCounts = shares.reduce((acc, s) => {
      acc[s.platform] = s._count.platform;
      return acc;
    }, {});

    res.json(shareCounts);
  } catch (error) {
    next(error);
  }
};