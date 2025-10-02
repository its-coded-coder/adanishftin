import { PrismaClient } from '@prisma/client';
import { UAParser } from 'ua-parser-js';

const prisma = new PrismaClient();

export const trackArticleView = async (req, res, next) => {
  try {
    const articleId = req.params.slug || req.params.id;
    const userId = req.user?.id;
    const sessionId = req.sessionID || req.headers['x-session-id'] || `session-${Date.now()}`;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    const referer = req.headers.referer || req.headers.referrer;
    
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    await prisma.articleView.create({
      data: {
        articleId,
        userId,
        sessionId,
        ipAddress,
        userAgent,
        referer,
        device: result.device.type || 'desktop',
        browser: result.browser.name,
        os: result.os.name,
        entryPage: !referer || !referer.includes(req.headers.host)
      }
    });

    await prisma.article.update({
      where: { id: articleId },
      data: { views: { increment: 1 } }
    });

    next();
  } catch (error) {
    next();
  }
};

export const updateUserSession = async (req, res, next) => {
  try {
    const sessionId = req.sessionID || req.headers['x-session-id'];
    if (!sessionId) return next();

    const userId = req.user?.id;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    const existingSession = await prisma.userSession.findUnique({
      where: { sessionId }
    });

    if (existingSession) {
      await prisma.userSession.update({
        where: { sessionId },
        data: {
          lastActivity: new Date(),
          pageViews: { increment: 1 }
        }
      });
    } else {
      await prisma.userSession.create({
        data: {
          sessionId,
          userId,
          ipAddress,
          userAgent,
          device: result.device.type || 'desktop',
          browser: result.browser.name,
          os: result.os.name
        }
      });
    }

    next();
  } catch (error) {
    next();
  }
};

export const trackUserJourney = async (req, res, next) => {
  try {
    const sessionId = req.sessionID || req.headers['x-session-id'];
    if (!sessionId) return next();

    const userId = req.user?.id;
    const action = `${req.method} ${req.path}`;
    const articleId = req.params.slug || req.params.id || req.params.articleId;

    const lastJourney = await prisma.userJourney.findFirst({
      where: { sessionId },
      orderBy: { step: 'desc' }
    });

    const step = lastJourney ? lastJourney.step + 1 : 1;

    await prisma.userJourney.create({
      data: {
        sessionId,
        userId,
        step,
        articleId,
        action,
        metadata: JSON.stringify({
          query: req.query,
          body: req.body
        })
      }
    });

    next();
  } catch (error) {
    next();
  }
};