import Joi from 'joi';

export const createContactSchema = Joi.object({
  name: Joi.string().min(3).max(20).required().messages({
    'string.base': 'The contact name must be a string',
    'string.min': 'The contact name must have at least {#limit} characters',
    'string.max': 'The contact name can have a maximum of {#limit} characters',
    'any.required': 'The contact name is mandatory',
  }),
  phoneNumber: Joi.string().min(3).max(20).required(),
  email: Joi.string(),
  isFavorite: Joi.boolean(),
  contactType: Joi.string().valid('work', 'home', 'personal').required(),
});

export const updateContactSchema = Joi.object({
  name: Joi.string().min(3).max(30),
  phoneNumber: Joi.string().min(6).max(16),
  email: Joi.string(),
  isFavourite: Joi.boolean(),
  contactType: Joi.string().valid('work', 'home', 'personal'),
});
