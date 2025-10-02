import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const advancedSearch = async (params) => {
  const {
    query,
    tags,
    author,
    startDate,
    endDate,
    isPremium,
    minPrice,
    maxPrice,
    featured,
    language,
    sortBy = 'relevance',
    page = 1,
    limit = 20
  } = params;

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));
  const skip = (pageNum - 1) * limitNum;

  const where = { status: 'PUBLISHED' };

  if (query) {
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { content: { contains: query, mode: 'insensitive' } },
      { excerpt: { contains: query, mode: 'insensitive' } },
      { keywords: { contains: query, mode: 'insensitive' } },
      { abstract: { contains: query, mode: 'insensitive' } }
    ];
  }

  if (tags && tags.length > 0) {
    where.tags = {
      some: {
        slug: { in: tags }
      }
    };
  }

  if (author) {
    where.author = {
      OR: [
        { name: { contains: author, mode: 'insensitive' } },
        { email: { contains: author, mode: 'insensitive' } }
      ]
    };
  }

  if (startDate || endDate) {
    where.publishedAt = {};
    if (startDate) where.publishedAt.gte = new Date(startDate);
    if (endDate) where.publishedAt.lte = new Date(endDate);
  }

  if (isPremium !== undefined) {
    where.isPremium = isPremium === 'true';
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice) where.price.gte = parseFloat(minPrice);
    if (maxPrice) where.price.lte = parseFloat(maxPrice);
  }

  if (featured !== undefined) {
    where.featured = featured === 'true';
  }

  if (language) {
    where.language = language;
  }

  let orderBy = {};
  switch (sortBy) {
    case 'date':
      orderBy = { publishedAt: 'desc' };
      break;
    case 'popularity':
      orderBy = { views: 'desc' };
      break;
    case 'price_asc':
      orderBy = { price: 'asc' };
      break;
    case 'price_desc':
      orderBy = { price: 'desc' };
      break;
    case 'title':
      orderBy = { title: 'asc' };
      break;
    default:
      orderBy = { publishedAt: 'desc' };
  }

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      skip,
      take: limitNum,
      orderBy,
      include: {
        author: {
          select: { id: true, name: true, email: true }
        },
        tags: true,
        _count: {
          select: {
            comments: true,
            articleLikes: true,
            shares: true
          }
        }
      }
    }),
    prisma.article.count({ where })
  ]);

  return {
    articles,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    },
    filters: params
  };
};

export const logSearchQuery = async (query, filters, results, userId) => {
  try {
    await prisma.searchQuery.create({
      data: {
        query,
        filters: filters ? JSON.stringify(filters) : null,
        results,
        userId
      }
    });
  } catch (error) {
    console.error('Error logging search query:', error);
  }
};

export const getPopularSearches = async (limit = 10) => {
  const searches = await prisma.searchQuery.groupBy({
    by: ['query'],
    _count: { query: true },
    orderBy: {
      _count: {
        query: 'desc'
      }
    },
    take: limit,
    where: {
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
    }
  });

  return searches.map(s => ({
    query: s.query,
    count: s._count.query
  }));
};

export const getSuggestions = async (query) => {
  if (!query || query.length < 2) {
    return [];
  }

  const [articles, tags] = await Promise.all([
    prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
        title: {
          contains: query,
          mode: 'insensitive'
        }
      },
      select: {
        title: true,
        slug: true
      },
      take: 5
    }),
    prisma.tag.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive'
        }
      },
      select: {
        name: true,
        slug: true
      },
      take: 5
    })
  ]);

  return {
    articles,
    tags
  };
};