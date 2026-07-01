import { Response, NextFunction } from "express";
import { Op } from "sequelize";
import { User } from "../models";
import { UserRole, AuthenticatedRequest } from "../types";
import {
  getPaginationOptions,
  buildPaginatedResponse,
} from "../utils/pagination";
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendError,
} from "../utils/response";
import { auditService } from "../services/audit.service";

export class UserController {
  async getAll(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { page, limit, offset } = getPaginationOptions(req);
      const { search, isActive } = req.query as {
        search?: string;
        isActive?: boolean;
      };

      const where: Record<string, unknown> = { role: UserRole.BORROWER };
      if (isActive !== undefined) where["isActive"] = isActive;
      if (search) {
        where[Op.or as unknown as string] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { mobile: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const { count, rows } = await User.findAndCountAll({
        where,
        limit,
        offset,
        attributes: { exclude: ["password", "fcmToken"] },
        order: [["createdAt", "DESC"]],
      });

      sendSuccess(
        res,
        buildPaginatedResponse(rows, count, { page, limit, offset }),
      );
    } catch (error) {
      next(error);
    }
  }

  async getById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const user = await User.findByPk(req.params["id"], {
        attributes: { exclude: ["password", "fcmToken"] },
      });
      if (!user) {
        sendNotFound(res, "Villager not found");
        return;
      }
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  async create(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { name, mobile, address, role } = req.body as {
        name: string;
        mobile: string;
        address?: string;
        role?: UserRole;
      };

      const existing = await User.findOne({ where: { mobile } });
      if (existing) {
        sendError(res, "Mobile number already registered", 409);
        return;
      }

      const user = await User.create({
        name,
        mobile,
        address,
        role: role ?? UserRole.BORROWER,
      });

      await auditService.log(
        req.user!.id,
        "CREATE_USER",
        "User",
        user.id,
        undefined,
        { name, mobile },
      );

      sendCreated(res, user.toSafeJSON(), "Villager added successfully");
    } catch (error) {
      next(error);
    }
  }

  async update(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const user = await User.findByPk(req.params["id"]);
      if (!user) {
        sendNotFound(res, "Villager not found");
        return;
      }

      const oldValues = user.toSafeJSON();
      await user.update(
        req.body as Partial<{
          name: string;
          mobile: string;
          address: string;
          isActive: boolean;
        }>,
      );
      await auditService.log(
        req.user!.id,
        "UPDATE_USER",
        "User",
        user.id,
        oldValues as object,
        user.toSafeJSON() as object,
      );

      sendSuccess(res, user.toSafeJSON(), "Villager updated successfully");
    } catch (error) {
      next(error);
    }
  }

  async deactivate(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const user = await User.findByPk(req.params["id"]);
      if (!user) {
        sendNotFound(res, "Villager not found");
        return;
      }
      await user.update({ isActive: false });
      await auditService.log(req.user!.id, "DEACTIVATE_USER", "User", user.id);
      sendSuccess(res, null, "Villager deactivated");
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
