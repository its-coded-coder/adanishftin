import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

export const listCollections = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [collections, total] = await Promise.all([
      prisma.collection.findMany({
        skip,
        take: limitNum,
        orderBy: { order: 'asc' },
        include: {
          articles: {
            include: {
              article: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  excerpt: true,
                  coverImage: true
                }
              }
            },
            orderBy: { order: 'asc' }
          }
        }
      }),
      prisma.collection.count()
    ]);

    res.json({
      collections,
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

export const getCollection = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const collection = await prisma.collection.findUnique({
      where: { slug },
      include: {
        articles: {
          include: {
            article: {
              include: {
                author: {
                  select: { id: true, name: true }
                },
                tags: true
              }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    res.json(collection);
  } catch (error) {
    next(error);
  }
};

export const createCollection = async (req, res, next) => {
  try {
    const { title, description, coverImage, order } = req.body;
    const slug = generateSlug(title);

    const collection = await prisma.collection.create({
      data: {
        title,
        description,
        slug,
        coverImage,
        order: order || 0
      }
    });

    res.status(201).json(collection);
  } catch (error) {
    next(error);
  }
};

export const updateCollection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, coverImage, order } = req.body;

    const collection = await prisma.collection.findUnique({
      where: { id }
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const updateData = {
      ...(title && { title, slug: generateSlug(title) }),
      ...(description !== undefined && { description }),
      ...(coverImage !== undefined && { coverImage }),
      ...(order !== undefined && { order })
    };

    const updatedCollection = await prisma.collection.update({
      where: { id },
      data: updateData
    });

    res.json(updatedCollection);
  } catch (error) {
    next(error);
  }
};

export const deleteCollection = async (req, res, next) => {
  try {
    const { id } = req.params;

    const collection = await prisma.collection.findUnique({
      where: { id }
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    await prisma.collection.delete({
      where: { id }
    });

    res.json({ message: 'Collection deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const addArticleToCollection = async (req, res, next) => {
  try {
    const { collectionId, articleId } = req.params;
    const { order } = req.body;

    const collection = await prisma.collection.findUnique({
      where: { id: collectionId }
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const article = await prisma.article.findUnique({
      where: { id: articleId }
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const existingArticle = await prisma.collectionArticle.findUnique({
      where: {
        collectionId_articleId: {
          collectionId,
          articleId
        }
      }
    });

    if (existingArticle) {
      return res.status(400).json({ error: 'Article already in collection' });
    }

    const collectionArticle = await prisma.collectionArticle.create({
      data: {
        collectionId,
        articleId,
        order: order || 0
      },
      include: {
        article: true
      }
    });

    res.status(201).json(collectionArticle);
  } catch (error) {
    next(error);
  }
};

export const removeArticleFromCollection = async (req, res, next) => {
  try {
    const { collectionId, articleId } = req.params;

    const collectionArticle = await prisma.collectionArticle.findUnique({
      where: {
        collectionId_articleId: {
          collectionId,
          articleId
        }
      }
    });

    if (!collectionArticle) {
      return res.status(404).json({ error: 'Article not in collection' });
    }

    await prisma.collectionArticle.delete({
      where: {
        collectionId_articleId: {
          collectionId,
          articleId
        }
      }
    });

    res.json({ message: 'Article removed from collection' });
  } catch (error) {
    next(error);
  }
};

export const updateArticleOrder = async (req, res, next) => {
  try {
    const { collectionId, articleId } = req.params;
    const { order } = req.body;

    const collectionArticle = await prisma.collectionArticle.findUnique({
      where: {
        collectionId_articleId: {
          collectionId,
          articleId
        }
      }
    });

    if (!collectionArticle) {
      return res.status(404).json({ error: 'Article not in collection' });
    }

    const updated = await prisma.collectionArticle.update({
      where: {
        collectionId_articleId: {
          collectionId,
          articleId
        }
      },
      data: { order }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};