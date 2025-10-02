import Joi from 'joi';

export const subscribeSchema = Joi.object({
  email: Joi.string().email().required(),
  tags: Joi.array().items(Joi.string()).optional()
});

export const unsubscribeSchema = Joi.object({
  email: Joi.string().email().required()
});

export const campaignSchema = Joi.object({
  subject: Joi.string().min(3).required(),
  content: Joi.string().min(10).required(),
  targetTags: Joi.array().items(Joi.string()).optional()
});