import { PrismaClient } from '@prisma/client';
import { sendCommentReplyNotification } from '../services/email.service.js';
import { createNotification } from './notification.controller.js';

const prisma = new PrismaClient();

export const getAllComments = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, approved } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (approved !== undefined) {
      where.approved = approved === 'true';
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true }
          },
          article: {
            select: { id: true, title: true, slug: true }
          }
        }
      }),
      prisma.comment.count({ where })
    ]);

    res.json({
      comments,
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

export const getComments = async (req, res, next) => {
  try {
    const { articleId } = req.params;
    const { page = 1, limit = 20, approved } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = { articleId, parentId: null };
    if (approved !== undefined && req.user?.role !== 'ADMIN') {
      where.approved = true;
    } else if (approved !== undefined) {
      where.approved = approved === 'true';
    } else if (!req.user || req.user.role !== 'ADMIN') {
      where.approved = true;
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true }
          },
          replies: {
            where: req.user?.role === 'ADMIN' ? {} : { approved: true },
            include: {
              user: {
                select: { id: true, name: true }
              }
            },
            orderBy: { createdAt: 'asc' }
          },
          _count: {
            select: { likedBy: true }
          }
        }
      }),
      prisma.comment.count({ where })
    ]);

    res.json({
      comments,
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

export const createComment = async (req, res, next) => {
  try {
    const { articleId } = req.params;
    const { content, parentId } = req.body;

    const article = await prisma.article.findUnique({
      where: { id: articleId }
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId }
      });
      if (!parentComment) {
        return res.status(404).json({ error: 'Parent comment not found' });
      }
    }

    const comment = await prisma.comment.create({
      data: {
        articleId,
        userId: req.user?.id,
        name: req.user?.name || 'Anonymous',
        email: req.user?.email,
        content,
        parentId,
        approved: req.user?.role === 'ADMIN'
      },
      include: {
        user: {
          select: { id: true, name: true }
        }
      }
    });

    await prisma.article.update({
      where: { id: articleId },
      data: { commentsCount: { increment: 1 } }
    });

    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        include: { user: true }
      });

      if (parentComment && parentComment.userId) {
        await createNotification(
          parentComment.userId,
          'COMMENT_REPLY',
          'New reply to your comment',
          `${req.user?.name || 'Someone'} replied to your comment`,
          `/article/${article.slug}`
        );

        await sendCommentReplyNotification(parentId, comment.id);
      }
    }

    res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
};

export const updateComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const comment = await prisma.comment.findUnique({
      where: { id }
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updatedComment = await prisma.comment.update({
      where: { id },
      data: { content },
      include: {
        user: {
          select: { id: true, name: true }
        }
      }
    });

    res.json(updatedComment);
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const comment = await prisma.comment.findUnique({
      where: { id }
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.comment.delete({
      where: { id }
    });

    await prisma.article.update({
      where: { id: comment.articleId },
      data: { commentsCount: { decrement: 1 } }
    });

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const approveComment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const comment = await prisma.comment.findUnique({
      where: { id }
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const updatedComment = await prisma.comment.update({
      where: { id },
      data: { approved: true },
      include: {
        user: {
          select: { id: true, name: true }
        }
      }
    });

    res.json(updatedComment);
  } catch (error) {
    next(error);
  }
};

export const likeComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ipAddress = req.ip;

    const comment = await prisma.comment.findUnique({
      where: { id }
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const existingLike = await prisma.commentLike.findFirst({
      where: {
        commentId: id,
        OR: [
          { userId: req.user?.id },
          { ipAddress }
        ]
      }
    });

    if (existingLike) {
      await prisma.commentLike.delete({
        where: { id: existingLike.id }
      });

      await prisma.comment.update({
        where: { id },
        data: { likes: { decrement: 1 } }
      });

      return res.json({ liked: false, likes: comment.likes - 1 });
    }

    await prisma.commentLike.create({
      data: {
        commentId: id,
        userId: req.user?.id,
        ipAddress: req.user ? null : ipAddress
      }
    });

    await prisma.comment.update({
      where: { id },
      data: { likes: { increment: 1 } }
    });

    res.json({ liked: true, likes: comment.likes + 1 });
  } catch (error) {
    next(error);
  }
};