import { generatePDF, downloadPDF } from '../services/pdf.service.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const requestPDFGeneration = async (req, res, next) => {
  try {
    const { articleId } = req.params;

    const article = await prisma.article.findUnique({
      where: { id: articleId }
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const existingPDF = await prisma.articlePDF.findFirst({
      where: { articleId },
      orderBy: { generatedAt: 'desc' }
    });

    if (existingPDF) {
      return res.json(existingPDF);
    }

    const pdf = await generatePDF(articleId);
    res.status(201).json(pdf);
  } catch (error) {
    next(error);
  }
};

export const getPDFs = async (req, res, next) => {
  try {
    const { articleId } = req.params;

    const pdfs = await prisma.articlePDF.findMany({
      where: { articleId },
      orderBy: { generatedAt: 'desc' }
    });

    res.json({ pdfs });
  } catch (error) {
    next(error);
  }
};

export const getPDFDownload = async (req, res, next) => {
  try {
    const { id } = req.params;

    const pdf = await downloadPDF(id);
    res.json({ url: pdf.pdfUrl });
  } catch (error) {
    next(error);
  }
};