import puppeteer from 'puppeteer';
import { PrismaClient } from '@prisma/client';
import minioClient from '../config/minio.js';
import crypto from 'crypto';

const prisma = new PrismaClient();

export const generatePDF = async (articleId) => {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      author: {
        select: { name: true, email: true }
      },
      tags: true,
      citations: {
        orderBy: { order: 'asc' }
      }
    }
  });

  if (!article) {
    throw new Error('Article not found');
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  const html = generateHTMLTemplate(article);
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '1cm',
      right: '1cm',
      bottom: '1cm',
      left: '1cm'
    }
  });

  await browser.close();

  const fileName = `pdfs/${articleId}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.pdf`;
  const bucket = process.env.MINIO_BUCKET_MEDIA;

  await minioClient.putObject(
    bucket,
    fileName,
    pdfBuffer,
    pdfBuffer.length,
    { 'Content-Type': 'application/pdf' }
  );

  const url = await minioClient.presignedGetObject(bucket, fileName, 24 * 60 * 60 * 365);

  const articlePDF = await prisma.articlePDF.create({
    data: {
      articleId,
      pdfUrl: url,
      version: '1.0'
    }
  });

  return articlePDF;
};

const generateHTMLTemplate = (article) => {
  const citationsHTML = article.citations?.map((citation, idx) => `
    <div class="citation">
      [${idx + 1}] ${citation.authors}. ${citation.title}. 
      ${citation.journal ? `${citation.journal}.` : ''} 
      ${citation.year ? `${citation.year}.` : ''}
      ${citation.doi ? `DOI: ${citation.doi}` : ''}
    </div>
  `).join('') || '';

  const tagsHTML = article.tags?.map(tag => `<span class="tag">${tag.name}</span>`).join('') || '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: 'Times New Roman', serif;
          font-size: 12pt;
          line-height: 1.6;
          color: #000;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        h1 {
          font-size: 24pt;
          margin-bottom: 10px;
          color: #000;
        }
        .metadata {
          font-size: 10pt;
          color: #666;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 1px solid #ccc;
        }
        .abstract {
          background: #f5f5f5;
          padding: 15px;
          margin: 20px 0;
          border-left: 3px solid #333;
        }
        .abstract h3 {
          margin-top: 0;
        }
        .content {
          text-align: justify;
        }
        .tag {
          display: inline-block;
          background: #eee;
          padding: 2px 8px;
          margin: 2px;
          border-radius: 3px;
          font-size: 9pt;
        }
        .references {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #000;
        }
        .references h3 {
          font-size: 14pt;
        }
        .citation {
          font-size: 10pt;
          margin: 10px 0;
          padding-left: 20px;
          text-indent: -20px;
        }
        img {
          max-width: 100%;
          height: auto;
        }
      </style>
    </head>
    <body>
      <h1>${article.title}</h1>
      
      <div class="metadata">
        <p><strong>Author:</strong> ${article.author.name}</p>
        <p><strong>Published:</strong> ${article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : 'N/A'}</p>
        ${article.doi ? `<p><strong>DOI:</strong> ${article.doi}</p>` : ''}
        ${article.keywords ? `<p><strong>Keywords:</strong> ${article.keywords}</p>` : ''}
        ${tagsHTML ? `<div><strong>Tags:</strong> ${tagsHTML}</div>` : ''}
      </div>

      ${article.abstract ? `
        <div class="abstract">
          <h3>Abstract</h3>
          <p>${article.abstract}</p>
        </div>
      ` : ''}

      <div class="content">
        ${article.content}
      </div>

      ${article.citations && article.citations.length > 0 ? `
        <div class="references">
          <h3>References</h3>
          ${citationsHTML}
        </div>
      ` : ''}
    </body>
    </html>
  `;
};

export const downloadPDF = async (pdfId) => {
  const pdf = await prisma.articlePDF.findUnique({
    where: { id: pdfId }
  });

  if (!pdf) {
    throw new Error('PDF not found');
  }

  await prisma.articlePDF.update({
    where: { id: pdfId },
    data: { downloads: { increment: 1 } }
  });

  return pdf;
};