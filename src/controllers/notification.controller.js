import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, read } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = { userId: req.user.id };
    if (read !== undefined) {
      where.read = read === 'true';
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId: req.user.id, read: false }
      })
    ]);

    res.json({
      notifications,
      unreadCount,
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

export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        read: false
      },
      data: { read: true }
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.notification.delete({
      where: { id }
    });

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
};

export const createNotification = async (userId, type, title, message, link) => {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link
      }
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

export const getEmailSubscription = async (req, res, next) => {
  try {
    const subscription = await prisma.emailSubscription.findUnique({
      where: { userId: req.user.id }
    });

    if (!subscription) {
      return res.json({
        frequency: 'IMMEDIATE',
        active: true,
        topics: null
      });
    }

    res.json(subscription);
  } catch (error) {
    next(error);
  }
};

export const updateEmailSubscription = async (req, res, next) => {
  try {
    const { frequency, topics, active } = req.body;

    const subscription = await prisma.emailSubscription.upsert({
      where: { userId: req.user.id },
      update: {
        frequency,
        topics: topics ? topics.join(',') : null,
        active
      },
      create: {
        userId: req.user.id,
        email: req.user.email,
        frequency,
        topics: topics ? topics.join(',') : null,
        active
      }
    });

    res.json(subscription);
  } catch (error) {
    next(error);
  }
};