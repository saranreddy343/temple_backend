import Joi from "joi";

export const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  mobile: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required(),
  address: Joi.string().max(500).optional(),
  role: Joi.string().valid("ADMIN", "BORROWER").optional().default("BORROWER"),
});

export const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  mobile: Joi.string().pattern(/^[0-9]{10}$/).optional(),
  address: Joi.string().max(500).optional(),
  isActive: Joi.boolean().optional(),
  fcmToken: Joi.string().optional(),
});

export const userQuerySchema = Joi.object({
  search: Joi.string().optional(),
  role: Joi.string().valid("ADMIN", "BORROWER").optional(),
  isActive: Joi.boolean().optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});
