import Joi from 'joi';

export const createCollectionSchema = Joi.object({
  title: Joi.string().min(3).required(),
  description: Joi.string().optional(),
  coverImage: Joi.string().uri().optional(),
  order: Joi.number().integer().min(0).optional()
});

export const updateCollectionSchema = Joi.object({
  title: Joi.string().min(3).optional(),
  description: Joi.string().optional(),
  coverImage: Joi.string().uri().optional(),
  order: Joi.number().integer().min(0).optional()
});

export const addArticleSchema = Joi.object({
  order: Joi.number().integer().min(0).optional()
});

export const updateOrderSchema = Joi.object({
  order: Joi.number().integer().min(0).required()
});