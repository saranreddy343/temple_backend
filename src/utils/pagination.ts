import { Request } from "express";
import { PaginationOptions, PaginatedResponse } from "../types";

export const getPaginationOptions = (req: Request): PaginationOptions => {
  const page = Math.max(1, parseInt(req.query["page"] as string) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(req.query["limit"] as string) || 10),
  );
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

export const buildPaginatedResponse = <T>(
  data: T[],
  total: number,
  options: PaginationOptions,
): PaginatedResponse<T> => {
  const totalPages = Math.ceil(total / options.limit);
  return {
    data,
    pagination: {
      total,
      page: options.page,
      limit: options.limit,
      totalPages,
      hasNext: options.page < totalPages,
      hasPrev: options.page > 1,
    },
  };
};
