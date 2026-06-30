import { Response } from "express";
import { ApiResponse } from "../types";

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = "Success",
  statusCode = 200,
): void => {
  const response: ApiResponse<T> = { success: true, message, data };
  res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message = "An error occurred",
  statusCode = 500,
  errors?: unknown[],
): void => {
  const response: ApiResponse = { success: false, message, errors };
  res.status(statusCode).json(response);
};

export const sendCreated = <T>(
  res: Response,
  data: T,
  message = "Created successfully",
): void => {
  sendSuccess(res, data, message, 201);
};

export const sendNotFound = (
  res: Response,
  message = "Resource not found",
): void => {
  sendError(res, message, 404);
};

export const sendUnauthorized = (
  res: Response,
  message = "Unauthorized",
): void => {
  sendError(res, message, 401);
};

export const sendForbidden = (res: Response, message = "Forbidden"): void => {
  sendError(res, message, 403);
};

export const sendBadRequest = (
  res: Response,
  message = "Bad Request",
  errors?: unknown[],
): void => {
  sendError(res, message, 400, errors);
};
