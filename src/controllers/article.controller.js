import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') + '-' + Date.now();
};

export const listArticles = async (req, res, next) => {
  try {
    const { status, isPremium, tag, page = 1, limit = 10, search } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (!req.user || req.user.role !== 'ADMIN') {
      where.status = 'PUBLISHED';
    } else if (status) {
      where.status = status;
    }

    if (isPremium !== undefined) {
      where.isPremium = isPremium === 'true';
    }

    if (tag) {
      where.tags = {
        some: {
          slug: tag
        }
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } }
      ];
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { publishedAt: 'desc' },
        include: {
          author: {
            select: { id: true, name: true, email: true }
          },
          tags: true,
          _count: {
            select: { bookmarks: true }
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

export const getArticle = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const article = await prisma.article.findUnique({
      where: { slug },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        },
        tags: true,
        media: true
      }
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (article.status !== 'PUBLISHED' && (!req.user || req.user.role !== 'ADMIN')) {
      return res.status(403).json({ error: 'Article not available' });
    }

    if (article.isPremium && article.status === 'PUBLISHED') {
      if (!req.user) {
        return res.json({
          ...article,
          content: article.excerpt || article.content.substring(0, 200) + '...',
          locked: true
        });
      }

      const purchase = await prisma.purchase.findFirst({
        where: {
          userId: req.user.id,
          articleId: article.id,
          status: 'COMPLETED'
        }
      });

      if (!purchase && req.user.role !== 'ADMIN') {
        return res.json({
          ...article,
          content: article.excerpt || article.content.substring(0, 200) + '...',
          locked: true
        });
      }
    }

    res.json(article);
  } catch (error) {
    next(error);
  }
};

export const createArticle = async (req, res, next) => {
  try {
    const { title, content, excerpt, coverImage, price, isPremium, tags } = req.body;
    const slug = generateSlug(title);

    const tagConnections = tags
      ? await Promise.all(
          tags.map(async (tagName) => {
            const tagSlug = tagName.toLowerCase().replace(/\s+/g, '-');
            return prisma.tag.upsert({
              where: { slug: tagSlug },
              create: { name: tagName, slug: tagSlug },
              update: {}
            });
          })
        )
      : [];

    const article = await prisma.article.create({
      data: {
        title,
        slug,
        content,
        excerpt,
        coverImage,
        price: price || 0,
        isPremium: isPremium || false,
        authorId: req.user.id,
        status: 'DRAFT',
        tags: {
          connect: tagConnections.map(tag => ({ id: tag.id }))
        }
      },
      include: {
        tags: true,
        author: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    res.status(201).json(article);
  } catch (error) {
    next(error);
  }
};

export const updateArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, excerpt, coverImage, price, isPremium, tags } = req.body;

    const article = await prisma.article.findUnique({
      where: { id }
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const updateData = {
      ...(title && { title, slug: generateSlug(title) }),
      ...(content && { content }),
      ...(excerpt !== undefined && { excerpt }),
      ...(coverImage !== undefined && { coverImage }),
      ...(price !== undefined && { price }),
      ...(isPremium !== undefined && { isPremium })
    };

    if (tags) {
      const tagConnections = await Promise.all(
        tags.map(async (tagName) => {
          const tagSlug = tagName.toLowerCase().replace(/\s+/g, '-');
          return prisma.tag.upsert({
            where: { slug: tagSlug },
            create: { name: tagName, slug: tagSlug },
            update: {}
          });
        })
      );

      updateData.tags = {
        set: [],
        connect: tagConnections.map(tag => ({ id: tag.id }))
      };
    }

    const updatedArticle = await prisma.article.update({
      where: { id },
      data: updateData,
      include: {
        tags: true,
        author: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    res.json(updatedArticle);
  } catch (error) {
    next(error);
  }
};

export const deleteArticle = async (req, res, next) => {
  try {
    const { id } = req.params;

    const article = await prisma.article.findUnique({
      where: { id }
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    await prisma.article.delete({
      where: { id }
    });

    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateArticleStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const article = await prisma.article.findUnique({
      where: { id }
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const updateData = { status };
    if (status === 'PUBLISHED' && !article.publishedAt) {
      updateData.publishedAt = new Date();
    }

    const updatedArticle = await prisma.article.update({
      where: { id },
      data: updateData,
      include: {
        tags: true,
        author: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    res.json(updatedArticle);
  } catch (error) {
    next(error);
  }
};

export const getArticleMedia = async (req, res, next) => {
  try {
    const { id } = req.params;

    const media = await prisma.media.findMany({
      where: { articleId: id }
    });

    res.json(media);
  } catch (error) {
    next(error);
  }
};