import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getCitations = async (req, res, next) => {
  try {
    const { articleId } = req.params;

    const citations = await prisma.citation.findMany({
      where: { articleId },
      orderBy: { order: 'asc' }
    });

    res.json({ citations });
  } catch (error) {
    next(error);
  }
};

export const createCitation = async (req, res, next) => {
  try {
    const { articleId } = req.params;
    const { authors, title, year, journal, volume, pages, doi, url, order } = req.body;

    const article = await prisma.article.findUnique({
      where: { id: articleId }
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const citation = await prisma.citation.create({
      data: {
        articleId,
        authors,
        title,
        year,
        journal,
        volume,
        pages,
        doi,
        url,
        order: order || 0
      }
    });

    res.status(201).json(citation);
  } catch (error) {
    next(error);
  }
};

export const updateCitation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { authors, title, year, journal, volume, pages, doi, url, order } = req.body;

    const citation = await prisma.citation.findUnique({
      where: { id }
    });

    if (!citation) {
      return res.status(404).json({ error: 'Citation not found' });
    }

    const updated = await prisma.citation.update({
      where: { id },
      data: {
        authors,
        title,
        year,
        journal,
        volume,
        pages,
        doi,
        url,
        order
      }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteCitation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const citation = await prisma.citation.findUnique({
      where: { id }
    });

    if (!citation) {
      return res.status(404).json({ error: 'Citation not found' });
    }

    await prisma.citation.delete({
      where: { id }
    });

    res.json({ message: 'Citation deleted' });
  } catch (error) {
    next(error);
  }
};

export const exportCitations = async (req, res, next) => {
  try {
    const { articleId } = req.params;
    const { format = 'bibtex' } = req.query;

    const citations = await prisma.citation.findMany({
      where: { articleId },
      orderBy: { order: 'asc' }
    });

    let output = '';

    if (format === 'bibtex') {
      citations.forEach((citation, idx) => {
        output += `@article{cite${idx + 1},\n`;
        output += `  author = {${citation.authors}},\n`;
        output += `  title = {${citation.title}},\n`;
        if (citation.journal) output += `  journal = {${citation.journal}},\n`;
        if (citation.year) output += `  year = {${citation.year}},\n`;
        if (citation.volume) output += `  volume = {${citation.volume}},\n`;
        if (citation.pages) output += `  pages = {${citation.pages}},\n`;
        if (citation.doi) output += `  doi = {${citation.doi}},\n`;
        output += `}\n\n`;
      });
    } else if (format === 'ris') {
      citations.forEach((citation) => {
        output += `TY  - JOUR\n`;
        output += `AU  - ${citation.authors}\n`;
        output += `TI  - ${citation.title}\n`;
        if (citation.journal) output += `JO  - ${citation.journal}\n`;
        if (citation.year) output += `PY  - ${citation.year}\n`;
        if (citation.volume) output += `VL  - ${citation.volume}\n`;
        if (citation.pages) output += `SP  - ${citation.pages}\n`;
        if (citation.doi) output += `DO  - ${citation.doi}\n`;
        output += `ER  -\n\n`;
      });
    }

    res.setHeader('Content-Type', 'text/plain');
    res.send(output);
  } catch (error) {
    next(error);
  }
};