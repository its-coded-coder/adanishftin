import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

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

const emailTemplates = {
  commentReply: (data) => ({
    subject: `New reply to your comment on "${data.articleTitle}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Reply to Your Comment</h2>
        <p>Hi ${data.userName},</p>
        <p>${data.replyAuthor} replied to your comment on <strong>${data.articleTitle}</strong>:</p>
        <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-left: 3px solid #007bff;">
          ${data.replyContent}
        </div>
        <p><a href="${data.articleUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Reply</a></p>
      </div>
    `
  }),

  newArticle: (data) => ({
    subject: `New Article: ${data.articleTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Article Published</h2>
        ${data.coverImage ? `<img src="${data.coverImage}" style="max-width: 100%; height: auto; border-radius: 8px;" />` : ''}
        <h3>${data.articleTitle}</h3>
        <p style="color: #666;">By ${data.authorName}</p>
        <p>${data.excerpt}</p>
        <p><a href="${data.articleUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Read Article</a></p>
      </div>
    `
  }),

  articleUpdate: (data) => ({
    subject: `Article Updated: ${data.articleTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Article Updated</h2>
        <p>The article <strong>${data.articleTitle}</strong> has been updated.</p>
        ${data.changelog ? `
          <div style="background: #f5f5f5; padding: 15px; margin: 20px 0;">
            <strong>What's New:</strong>
            <p>${data.changelog}</p>
          </div>
        ` : ''}
        <p><a href="${data.articleUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Article</a></p>
      </div>
    `
  }),

  commentLike: (data) => ({
    subject: `Someone liked your comment on "${data.articleTitle}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your Comment Received a Like</h2>
        <p>Hi ${data.userName},</p>
        <p>Someone liked your comment on <strong>${data.articleTitle}</strong>:</p>
        <div style="background: #f5f5f5; padding: 15px; margin: 20px 0;">
          ${data.commentContent}
        </div>
        <p><a href="${data.articleUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Comment</a></p>
      </div>
    `
  }),

  purchaseConfirmation: (data) => ({
    subject: `Purchase Confirmation: ${data.articleTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Purchase Confirmed</h2>
        <p>Hi ${data.userName},</p>
        <p>Thank you for your purchase of <strong>${data.articleTitle}</strong>.</p>
        <div style="background: #f5f5f5; padding: 15px; margin: 20px 0;">
          <p><strong>Amount:</strong> $${data.amount}</p>
          <p><strong>Transaction ID:</strong> ${data.transactionId}</p>
          <p><strong>Date:</strong> ${new Date(data.purchaseDate).toLocaleString()}</p>
        </div>
        <p><a href="${data.articleUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Read Article</a></p>
      </div>
    `
  }),

  weeklyDigest: (data) => ({
    subject: 'Your Weekly Reading Digest',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your Weekly Digest</h2>
        <p>Hi ${data.userName},</p>
        <p>Here are this week's most popular articles:</p>
        ${data.articles.map(article => `
          <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
            ${article.coverImage ? `<img src="${article.coverImage}" style="max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 10px;" />` : ''}
            <h3 style="margin: 10px 0;">${article.title}</h3>
            <p style="color: #666;">${article.excerpt}</p>
            <a href="${article.url}" style="color: #007bff; text-decoration: none;">Read More →</a>
          </div>
        `).join('')}
      </div>
    `
  })
};

export const sendEmail = async (to, templateName, data) => {
  try {
    const template = emailTemplates[templateName](data);
    
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@publishing.com',
      to,
      subject: template.subject,
      html: template.html
    });

    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
};

export const sendCommentReplyNotification = async (commentId, replyId) => {
  const reply = await prisma.comment.findUnique({
    where: { id: replyId },
    include: {
      article: true,
      user: true,
      parent: {
        include: { user: true }
      }
    }
  });

  if (!reply.parent || !reply.parent.user) return;

  const subscription = await prisma.emailSubscription.findFirst({
    where: {
      userId: reply.parent.userId,
      active: true
    }
  });

  if (!subscription) return;

  await sendEmail(reply.parent.user.email, 'commentReply', {
    userName: reply.parent.user.name,
    articleTitle: reply.article.title,
    replyAuthor: reply.user?.name || reply.name,
    replyContent: reply.content,
    articleUrl: `${process.env.FRONTEND_URL}/article/${reply.article.slug}`
  });
};

export const sendNewArticleNotification = async (articleId) => {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: { author: true }
  });

  if (!article) return;

  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: { isActive: true }
  });

  for (const subscriber of subscribers) {
    await sendEmail(subscriber.email, 'newArticle', {
      articleTitle: article.title,
      authorName: article.author.name,
      excerpt: article.excerpt || '',
      coverImage: article.coverImage,
      articleUrl: `${process.env.FRONTEND_URL}/article/${article.slug}`
    });
  }
};

export const sendWeeklyDigest = async () => {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const topArticles = await prisma.article.findMany({
    where: {
      status: 'PUBLISHED',
      publishedAt: { gte: oneWeekAgo }
    },
    orderBy: { views: 'desc' },
    take: 5,
    include: { author: true }
  });

  const subscribers = await prisma.emailSubscription.findMany({
    where: {
      active: true,
      frequency: 'WEEKLY'
    },
    include: { user: true }
  });

  for (const subscriber of subscribers) {
    const userName = subscriber.user?.name || subscriber.email.split('@')[0];
    
    await sendEmail(subscriber.email, 'weeklyDigest', {
      userName,
      articles: topArticles.map(article => ({
        title: article.title,
        excerpt: article.excerpt || '',
        coverImage: article.coverImage,
        url: `${process.env.FRONTEND_URL}/article/${article.slug}`
      }))
    });
  }
};