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
      const type = req.query["type"] as string | undefined;
      const result = await notificationService.getUserNotifications(
        req.user!.id,
        page,
        limit,
        type,
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

  async markOpened(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await notificationService.markOpened(req.params["id"], req.user!.id);
      sendSuccess(res, null, "Notification opened");
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

  async deleteNotification(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const deleted = await notificationService.deleteUserNotification(
        req.params["id"],
        req.user!.id,
      );
      if (!deleted) {
        sendNotFound(res, "Notification not found");
        return;
      }
      sendSuccess(res, null, "Notification deleted");
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

  async getStats(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (req.user?.role !== UserRole.ADMIN) {
        sendError(res, "Admins only", 403);
        return;
      }
      const stats = await notificationService.getAdminStats(req.user!.id);
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
