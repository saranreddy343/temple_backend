import Joi from "joi";
import { Request, Response, NextFunction } from "express";
import { sendBadRequest } from "../utils/response";

type ValidationTarget = "body" | "query" | "params";

export const validate = (
  schema: Joi.ObjectSchema,
  target: ValidationTarget = "body",
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[target], {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false,
    });

    if (error) {
      const errors = error.details.map((d) => ({
        field: d.path.join("."),
        message: d.message,
      }));
      sendBadRequest(res, "Validation failed", errors);
      return;
    }

    req[target] = value;
    next();
  };
};
