import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const prisma = new PrismaClient();

export const createPaymentIntent = async (req, res, next) => {
  try {
    const { articleId } = req.body;

    const article = await prisma.article.findUnique({
      where: { id: articleId }
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (!article.isPremium) {
      return res.status(400).json({ error: 'Article is not premium' });
    }

    const existingPurchase = await prisma.purchase.findFirst({
      where: {
        userId: req.user.id,
        articleId,
        status: 'COMPLETED'
      }
    });

    if (existingPurchase) {
      return res.status(400).json({ error: 'Article already purchased' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(article.price * 100),
      currency: 'usd',
      metadata: {
        articleId,
        userId: req.user.id
      }
    });

    await prisma.purchase.create({
      data: {
        userId: req.user.id,
        articleId,
        amount: article.price,
        stripePaymentId: paymentIntent.id,
        status: 'PENDING'
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    next(error);
  }
};

export const confirmPayment = async (req, res, next) => {
  try {
    const { paymentIntentId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      const purchase = await prisma.purchase.findUnique({
        where: { stripePaymentId: paymentIntentId },
        include: { article: true }
      });

      if (purchase && purchase.status !== 'COMPLETED') {
        await prisma.purchase.update({
          where: { id: purchase.id },
          data: { status: 'COMPLETED' }
        });

        const stripeFee = purchase.amount * 0.029 + 0.30;
        const netRevenue = purchase.amount - stripeFee;

        await prisma.revenueAnalytics.create({
          data: {
            articleId: purchase.articleId,
            purchaseId: purchase.id,
            userId: purchase.userId,
            amount: purchase.amount,
            netRevenue,
            stripeFee,
            stripeSessionId: paymentIntentId
          }
        });
      }

      res.json({ 
        success: true,
        purchase
      });
    } else {
      res.status(400).json({ 
        success: false,
        status: paymentIntent.status 
      });
    }
  } catch (error) {
    next(error);
  }
};

export const getPaymentHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [payments, total] = await Promise.all([
      prisma.purchase.findMany({
        where: { userId: req.user.id },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          article: {
            select: {
              id: true,
              title: true,
              slug: true
            }
          }
        }
      }),
      prisma.purchase.count({ where: { userId: req.user.id } })
    ]);

    res.json({
      payments,
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

export const webhookHandler = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;

    await prisma.purchase.updateMany({
      where: { stripePaymentId: paymentIntent.id },
      data: { status: 'COMPLETED' }
    });
  } else if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object;

    await prisma.purchase.updateMany({
      where: { stripePaymentId: paymentIntent.id },
      data: { status: 'FAILED' }
    });
  }

  res.json({ received: true });
};