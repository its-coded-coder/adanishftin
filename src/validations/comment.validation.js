import Joi from 'joi';

export const createCommentSchema = Joi.object({
  content: Joi.string().min(1).max(5000).required(),
  parentId: Joi.string().uuid().optional()
});

export const updateCommentSchema = Joi.object({
  content: Joi.string().min(1).max(5000).required()
});

export const reactionSchema = Joi.object({
  type: Joi.string().valid('LIKE', 'LOVE', 'INSIGHTFUL', 'INTERESTING', 'HELPFUL').required()
});

export const shareSchema = Joi.object({
  platform: Joi.string().valid('TWITTER', 'FACEBOOK', 'LINKEDIN', 'REDDIT', 'EMAIL', 'COPY_LINK', 'WHATSAPP').required()
});