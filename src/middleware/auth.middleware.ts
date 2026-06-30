import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User } from "../models";
import { JwtPayload, AuthenticatedRequest } from "../types";
import { sendUnauthorized } from "../utils/response";

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader?.startsWith("Bearer ")) {
      sendUnauthorized(res, "Access token required");
      return;
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      sendUnauthorized(res, "Access token required");
      return;
    }

    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    const user = await User.findOne({
      where: { id: payload.id, isActive: true },
    });
    if (!user) {
      sendUnauthorized(res, "User account deactivated or not found");
      return;
    }

    req.user = { id: payload.id, mobile: payload.mobile, role: payload.role };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      sendUnauthorized(res, "Access token expired");
    } else if (error instanceof jwt.JsonWebTokenError) {
      sendUnauthorized(res, "Invalid access token");
    } else {
      next(error);
    }
  }
};
