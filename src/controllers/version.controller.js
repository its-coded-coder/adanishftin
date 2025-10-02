import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createVersion = async (req, res, next) => {
  try {
    const { articleId } = req.params;
    const { version, changelog } = req.body;

    const article = await prisma.article.findUnique({
      where: { id: articleId }
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const articleVersion = await prisma.articleVersion.create({
      data: {
        articleId,
        version,
        content: article.content,
        changelog
      }
    });

    res.status(201).json(articleVersion);
  } catch (error) {
    next(error);
  }
};

export const getVersions = async (req, res, next) => {
  try {
    const { articleId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [versions, total] = await Promise.all([
      prisma.articleVersion.findMany({
        where: { articleId },
        skip,
        take: limitNum,
        orderBy: { publishedAt: 'desc' }
      }),
      prisma.articleVersion.count({ where: { articleId } })
    ]);

    res.json({
      versions,
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

export const getVersion = async (req, res, next) => {
  try {
    const { id } = req.params;

    const version = await prisma.articleVersion.findUnique({
      where: { id },
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

    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }

    res.json(version);
  } catch (error) {
    next(error);
  }
};

export const restoreVersion = async (req, res, next) => {
  try {
    const { id } = req.params;

    const version = await prisma.articleVersion.findUnique({
      where: { id }
    });

    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }

    await prisma.article.update({
      where: { id: version.articleId },
      data: { content: version.content }
    });

    res.json({ message: 'Version restored successfully' });
  } catch (error) {
    next(error);
  }
};