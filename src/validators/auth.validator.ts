import Joi from "joi";

export const adminLoginSchema = Joi.object({
  mobile: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      "string.pattern.base": "Mobile must be a 10-digit number",
    }),
  password: Joi.string().min(6).required(),
});

export const sendOTPSchema = Joi.object({
  mobile: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required(),
});

export const verifyOTPSchema = Joi.object({
  mobile: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required(),
  otp: Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required(),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  address: Joi.string().trim().allow("", null).max(500).optional(),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().min(6).required(),
  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/)
    .required()
    .messages({
      "string.pattern.base":
        "New password must include uppercase, lowercase, number, and special character",
    }),
});
