import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('Unauthorized');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!session || session.expiresAt < new Date()) {
      throw new Error('Unauthorized');
    }

    req.user = session.user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

export const optionalAuthenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true }
    });

    if (session && session.expiresAt >= new Date()) {
      req.user = session.user;
      req.token = token;
    }
    
    next();
  } catch (error) {
    next();
  }
};

export const isAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};