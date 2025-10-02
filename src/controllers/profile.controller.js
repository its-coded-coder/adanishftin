import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const getBookmarks = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [bookmarks, total] = await Promise.all([
      prisma.bookmark.findMany({
        where: { userId: req.user.id },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          article: {
            include: {
              author: {
                select: { id: true, name: true, email: true }
              },
              tags: true
            }
          }
        }
      }),
      prisma.bookmark.count({ where: { userId: req.user.id } })
    ]);

    res.json({
      bookmarks: bookmarks.map(b => b.article),
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

export const addBookmark = async (req, res, next) => {
  try {
    const { articleId } = req.params;

    const article = await prisma.article.findUnique({
      where: { id: articleId }
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_articleId: {
          userId: req.user.id,
          articleId
        }
      }
    });

    if (existingBookmark) {
      return res.status(400).json({ error: 'Article already bookmarked' });
    }

    const bookmark = await prisma.bookmark.create({
      data: {
        userId: req.user.id,
        articleId
      }
    });

    res.status(201).json(bookmark);
  } catch (error) {
    next(error);
  }
};

export const removeBookmark = async (req, res, next) => {
  try {
    const { articleId } = req.params;

    const bookmark = await prisma.bookmark.findUnique({
      where: {
        userId_articleId: {
          userId: req.user.id,
          articleId
        }
      }
    });

    if (!bookmark) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }

    await prisma.bookmark.delete({
      where: {
        userId_articleId: {
          userId: req.user.id,
          articleId
        }
      }
    });

    res.json({ message: 'Bookmark removed successfully' });
  } catch (error) {
    next(error);
  }
};

export const getPurchases = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        where: { 
          userId: req.user.id,
          status: 'COMPLETED'
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          article: {
            include: {
              author: {
                select: { id: true, name: true, email: true }
              },
              tags: true
            }
          }
        }
      }),
      prisma.purchase.count({ 
        where: { 
          userId: req.user.id,
          status: 'COMPLETED'
        }
      })
    ]);

    res.json({
      purchases,
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