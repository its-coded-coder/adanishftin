import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export const subscribe = async (req, res, next) => {
  try {
    const { email, tags } = req.body;

    const existingSubscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email }
    });

    if (existingSubscriber) {
      if (existingSubscriber.isActive) {
        return res.status(400).json({ error: 'Email already subscribed' });
      }
      
      await prisma.newsletterSubscriber.update({
        where: { email },
        data: { 
          isActive: true,
          tags: tags ? tags.join(',') : null
        }
      });

      return res.json({ message: 'Subscription reactivated' });
    }

    const subscriber = await prisma.newsletterSubscriber.create({
      data: {
        email,
        userId: req.user?.id,
        tags: tags ? tags.join(',') : null,
        isActive: true
      }
    });

    res.status(201).json({
      message: 'Subscribed successfully',
      subscriber
    });
  } catch (error) {
    next(error);
  }
};

export const unsubscribe = async (req, res, next) => {
  try {
    const { email } = req.body;

    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email }
    });

    if (!subscriber) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    await prisma.newsletterSubscriber.update({
      where: { email },
      data: { isActive: false }
    });

    res.json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    next(error);
  }
};

export const getSubscribers = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, isActive, tags } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    if (tags) {
      where.tags = { contains: tags };
    }

    const [subscribers, total] = await Promise.all([
      prisma.newsletterSubscriber.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { subscribedAt: 'desc' }
      }),
      prisma.newsletterSubscriber.count({ where })
    ]);

    res.json({
      subscribers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createCampaign = async (req, res, next) => {
  try {
    const { subject, content, targetTags } = req.body;

    const where = { isActive: true };
    if (targetTags && targetTags.length > 0) {
      where.OR = targetTags.map(tag => ({
        tags: { contains: tag }
      }));
    }

    const subscribers = await prisma.newsletterSubscriber.findMany({
      where
    });

    const campaign = await prisma.newsletterCampaign.create({
      data: {
        subject,
        content,
        targetTags: targetTags ? targetTags.join(',') : null
      }
    });

    let sentCount = 0;
    const emailPromises = subscribers.map(async (subscriber) => {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM,
          to: subscriber.email,
          subject,
          html: content
        });
        sentCount++;
      } catch (error) {
        console.error(`Failed to send to ${subscriber.email}:`, error);
      }
    });

    await Promise.all(emailPromises);

    await prisma.newsletterCampaign.update({
      where: { id: campaign.id },
      data: {
        sentAt: new Date(),
        sentCount
      }
    });

    res.json({
      message: 'Campaign sent successfully',
      campaign: {
        ...campaign,
        sentCount
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getCampaigns = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [campaigns, total] = await Promise.all([
      prisma.newsletterCampaign.findMany({
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.newsletterCampaign.count()
    ]);

    res.json({
      campaigns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};