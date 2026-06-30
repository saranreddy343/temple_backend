import Joi from "joi";

export const createLoanSchema = Joi.object({
  borrowerId: Joi.string().uuid().required(),
  loanNumber: Joi.string().max(50).optional(),
  bondNumber: Joi.string().max(80).allow("", null).optional(),
  principalAmount: Joi.number().positive().min(1000).required(),
  interestRate: Joi.number().positive().max(100).required(),
  loanDate: Joi.date().iso().required(),
  durationMonths: Joi.number().integer().valid(3, 6).required(),
  remarks: Joi.string().max(500).optional(),
});

export const updateLoanSchema = Joi.object({
  loanNumber: Joi.string().max(50).optional(),
  bondNumber: Joi.string().max(80).allow("", null).optional(),
  principalAmount: Joi.number().positive().min(1000).optional(),
  interestRate: Joi.number().positive().max(100).optional(),
  durationMonths: Joi.number().integer().valid(3, 6).optional(),
  remarks: Joi.string().max(500).allow("", null).optional(),
}).min(1);

export const collectInterestSchema = Joi.object({
  loanId: Joi.string().uuid().required(),
  month: Joi.number().integer().min(1).max(12).required(),
  year: Joi.number().integer().min(2000).max(2100).required(),
  paidDate: Joi.date().iso().required(),
  remarks: Joi.string().max(500).optional(),
});

export const collectPrincipalSchema = Joi.object({
  loanId: Joi.string().uuid().required(),
  amount: Joi.number().positive().required(),
  paidDate: Joi.date().iso().required(),
  remarks: Joi.string().max(500).optional(),
});

export const loanQuerySchema = Joi.object({
  status: Joi.string().valid("ACTIVE", "DUE_SOON", "OVERDUE", "COMPLETED", "CANCELLED").optional(),
  borrowerId: Joi.string().uuid().optional(),
  search: Joi.string().optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  sortBy: Joi.string()
    .valid("createdAt", "loanDate", "principalAmount", "dueDate")
    .optional(),
  sortOrder: Joi.string().valid("ASC", "DESC").optional(),
});
