import { Response, NextFunction } from "express";
import { UserNotification } from "../models";
import {
  AuthenticatedRequest,
  NotificationTargetType,
  UserRole,
} from "../types";
import {
  getPaginationOptions,
  buildPaginatedResponse,
} from "../utils/pagination";
import { sendSuccess, sendNotFound, sendError } from "../utils/response";
import { notificationService } from "../services/notification.service";

export class NotificationController {
  async getAll(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { page, limit } = getPaginationOptions(req);
      const result = await notificationService.getUserNotifications(
        req.user!.id,
        page,
        limit,
      );
      sendSuccess(
        res,
        buildPaginatedResponse(result.rows, result.count, {
          page,
          limit,
          offset: (page - 1) * limit,
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  async broadcast(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (req.user?.role !== UserRole.ADMIN) {
        sendError(res, "Admins only", 403);
        return;
      }
      const notification = await notificationService.broadcast({
        ...(req.body as any),
        createdBy: req.user!.id,
      });
      sendSuccess(res, notification, "Notification sent");
    } catch (error) {
      next(error);
    }
  }

  async markRead(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userNotif = await UserNotification.findOne({
        where: { id: req.params["id"], userId: req.user!.id },
      });
      if (!userNotif) {
        sendNotFound(res, "Notification not found");
        return;
      }
      await userNotif.update({ isRead: true, readAt: new Date() });
      sendSuccess(res, null, "Marked as read");
    } catch (error) {
      next(error);
    }
  }

  async markAllRead(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await notificationService.markAllRead(req.user!.id);
      sendSuccess(res, null, "All notifications marked as read");
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const count = await notificationService.getUnreadCount(req.user!.id);
      sendSuccess(res, { count });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
