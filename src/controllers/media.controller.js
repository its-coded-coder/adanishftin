import { PrismaClient } from '@prisma/client';
import minioClient from '../config/minio.js';
import crypto from 'crypto';

const prisma = new PrismaClient();

export const uploadMedia = async (req, res, next) => {
  try {
    const { articleId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const article = await prisma.article.findUnique({
      where: { id: articleId }
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${articleId}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${fileExtension}`;
    const bucket = process.env.MINIO_BUCKET_MEDIA;

    await minioClient.putObject(
      bucket,
      fileName,
      file.buffer,
      file.size,
      {
        'Content-Type': file.mimetype
      }
    );

    const url = await minioClient.presignedGetObject(bucket, fileName, 24 * 60 * 60);

    const mediaType = file.mimetype.startsWith('image/') ? 'IMAGE' : 'VIDEO';

    const media = await prisma.media.create({
      data: {
        url,
        type: mediaType,
        articleId,
        minioKey: fileName,
        size: file.size
      }
    });

    res.status(201).json(media);
  } catch (error) {
    next(error);
  }
};

export const deleteMedia = async (req, res, next) => {
  try {
    const { id } = req.params;

    const media = await prisma.media.findUnique({
      where: { id }
    });

    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    await minioClient.removeObject(process.env.MINIO_BUCKET_MEDIA, media.minioKey);

    await prisma.media.delete({
      where: { id }
    });

    res.json({ message: 'Media deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getPresignedUrl = async (req, res, next) => {
  try {
    const { id } = req.params;

    const media = await prisma.media.findUnique({
      where: { id }
    });

    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    const url = await minioClient.presignedGetObject(
      process.env.MINIO_BUCKET_MEDIA,
      media.minioKey,
      24 * 60 * 60
    );

    res.json({ url });
  } catch (error) {
    next(error);
  }
};