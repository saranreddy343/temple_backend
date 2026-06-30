import { Response, NextFunction } from "express";
import { UserRole, AuthenticatedRequest } from "../types";
import { sendForbidden } from "../utils/response";

export const requireRole = (...roles: UserRole[]) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): void => {
    if (!req.user) {
      sendForbidden(res, "Authentication required");
      return;
    }
    if (!roles.includes(req.user.role)) {
      sendForbidden(res, "Insufficient permissions");
      return;
    }
    next();
  };
};

export const requireAdmin = requireRole(UserRole.ADMIN);
export const requireBorrower = requireRole(UserRole.BORROWER);
export const requireAny = requireRole(UserRole.ADMIN, UserRole.BORROWER);
