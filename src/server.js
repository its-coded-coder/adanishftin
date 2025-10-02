import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.routes.js';
import articleRoutes from './routes/article.routes.js';
import profileRoutes from './routes/profile.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import newsletterRoutes from './routes/newsletter.routes.js';
import adminRoutes from './routes/admin.routes.js';
import commentRoutes from './routes/comment.routes.js';
import reactionRoutes from './routes/reaction.routes.js';
import collectionRoutes from './routes/collection.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import progressRoutes from './routes/progress.routes.js';
import citationRoutes from './routes/citation.routes.js';
import versionRoutes from './routes/version.routes.js';
import pdfRoutes from './routes/pdf.routes.js';
import searchRoutes from './routes/search.routes.js';
import relatedRoutes from './routes/related.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initializeBuckets } from './config/minio.js';
import { updateUserSession, trackUserJourney } from './middleware/analytics.middleware.js';
import { startScheduledJobs } from './services/scheduler.service.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

initializeBuckets().catch(console.error);
startScheduledJobs();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: 'Too many requests from this IP',
  skip: (req) => {
    return req.path.includes('/progress') || req.path.includes('/realtime');
  }
});

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(limiter);
app.use(updateUserSession);
app.use(trackUserJourney);

app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/reactions', reactionRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/citations', citationRoutes);
app.use('/api/versions', versionRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/related', relatedRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

app.use(express.static(path.join(__dirname, '../client/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});