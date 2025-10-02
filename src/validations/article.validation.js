import Joi from 'joi';

export const createArticleSchema = Joi.object({
  title: Joi.string().min(3).required(),
  content: Joi.string().min(10).required(),
  excerpt: Joi.string().optional(),
  coverImage: Joi.string().uri().optional(),
  price: Joi.number().min(0).default(0),
  isPremium: Joi.boolean().default(false),
  tags: Joi.array().items(Joi.string()).optional()
});

export const updateArticleSchema = Joi.object({
  title: Joi.string().min(3).optional(),
  content: Joi.string().min(10).optional(),
  excerpt: Joi.string().optional(),
  coverImage: Joi.string().uri().optional(),
  price: Joi.number().min(0).optional(),
  isPremium: Joi.boolean().optional(),
  tags: Joi.array().items(Joi.string()).optional()
});

export const statusSchema = Joi.object({
  status: Joi.string().valid('DRAFT', 'STAGING', 'PUBLISHED').required()
});