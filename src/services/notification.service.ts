import { Op } from "sequelize";
import { Notification, UserNotification, User, Loan } from "../models";
import { getMessaging } from "../config/firebase";
import { logger } from "../utils/logger";
import {
  LoanStatus,
  NotificationTargetType,
  NotificationStatus,
} from "../types";
import { getDaysUntilDue, formatDate, formatCurrency } from "../utils/helpers";

interface BroadcastInput {
  title: string;
  message: string;
  type: string;
  targetType: NotificationTargetType;
  targetUserId?: string;
  createdBy: string;
  scheduledDate?: Date;
}

export class NotificationService {
  async broadcast(input: BroadcastInput): Promise<Notification> {
    const notification = await Notification.create({
      title: input.title,
      message: input.message,
      type: input.type,
      targetType: input.targetType,
      targetUserId: input.targetUserId,
      createdBy: input.createdBy,
      scheduledDate: input.scheduledDate,
      status: NotificationStatus.PENDING,
    });

    await this.deliverNotification(notification);
    return notification;
  }

  async deliverNotification(notification: Notification): Promise<void> {
    let users: User[] = [];

    if (
      notification.targetType === NotificationTargetType.SPECIFIC_USER &&
      notification.targetUserId
    ) {
      const user = await User.findByPk(notification.targetUserId);
      if (user) users = [user];
    } else if (notification.targetType === NotificationTargetType.ADMINS_ONLY) {
      users = await User.findAll({ where: { role: "ADMIN", isActive: true } });
    } else if (
      notification.targetType === NotificationTargetType.BORROWERS_ONLY
    ) {
      users = await User.findAll({
        where: { role: "BORROWER", isActive: true },
      });
    } else {
      users = await User.findAll({ where: { isActive: true } });
    }

    await UserNotification.bulkCreate(
      users.map((u) => ({ notificationId: notification.id, userId: u.id })),
      { ignoreDuplicates: true },
    );

    for (const user of users) {
      if (user.fcmToken) {
        await this.sendPushNotification(
          user.fcmToken,
          notification.title,
          notification.message,
        );
      }
    }

    await notification.update({ status: NotificationStatus.SENT });
  }

  async sendLoanCreatedNotification(borrower: User, loan: Loan): Promise<void> {
    await this.broadcast({
      title: "Loan Sanctioned",
      message: `Loan ${loan.loanNumber} of ${formatCurrency(Number(loan.principalAmount))} has been sanctioned. Total repayable: ${formatCurrency(Number(loan.totalPayable))} by ${formatDate(loan.dueDate)}.`,
      type: "LOAN_CREATED",
      targetType: NotificationTargetType.SPECIFIC_USER,
      targetUserId: borrower.id,
      createdBy: loan.createdBy,
    });
  }

  async sendLoanClosedNotification(borrower: User, loan: Loan): Promise<void> {
    await this.broadcast({
      title: "Loan Closed",
      message: `Your loan ${loan.loanNumber} has been successfully closed. Payment of ${formatCurrency(Number(loan.totalPayable))} received. Thank you!`,
      type: "LOAN_CLOSED",
      targetType: NotificationTargetType.SPECIFIC_USER,
      targetUserId: borrower.id,
      createdBy: loan.updatedBy ?? loan.createdBy,
    });
  }

  async sendLoanReminders(): Promise<void> {
    const REMINDER_DAYS = [7, 5, 1, 0, -1, -7];

    const activeLoans = await Loan.findAll({
      where: {
        status: {
          [Op.in]: [LoanStatus.ACTIVE, LoanStatus.DUE_SOON, LoanStatus.OVERDUE],
        },
      },
      include: [{ model: User, as: "borrower" }],
    });

    for (const loan of activeLoans) {
      const daysUntilDue = getDaysUntilDue(loan.dueDate);
      const borrower = (loan as any).borrower as User;
      if (!borrower) continue;

      if (!REMINDER_DAYS.includes(daysUntilDue)) continue;

      let title: string;
      let message: string;
      const amount = formatCurrency(Number(loan.totalPayable));
      const dueDateStr = formatDate(loan.dueDate);

      if (daysUntilDue > 0) {
        title = "Loan Repayment Reminder";
        message = `Your loan repayment of ${amount} is due on ${dueDateStr}. (${daysUntilDue} day${daysUntilDue !== 1 ? "s" : ""} remaining)`;
      } else if (daysUntilDue === 0) {
        title = "Loan Repayment Due Today";
        message = `Your loan repayment of ${amount} is due TODAY. Please contact temple administration.`;
      } else {
        title = "Loan Repayment Overdue";
        message = `Your loan repayment of ${amount} was due on ${dueDateStr}. It is now overdue. Please contact the temple administration immediately.`;
      }

      // Avoid duplicate reminders on the same day by checking existing ones
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const existing = await Notification.findOne({
        where: {
          type: "LOAN_REMINDER",
          targetUserId: borrower.id,
          createdAt: { [Op.gte]: today, [Op.lt]: tomorrow },
        },
        include: [
          {
            model: UserNotification,
            as: "userNotifications",
            where: { userId: borrower.id },
            required: true,
          },
        ],
      });

      if (existing) continue;

      await this.broadcast({
        title,
        message,
        type: "LOAN_REMINDER",
        targetType: NotificationTargetType.SPECIFIC_USER,
        targetUserId: borrower.id,
        createdBy: loan.createdBy,
      });
    }
  }

  async sendPushNotification(
    fcmToken: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    const messaging = getMessaging();
    if (!messaging) {
      logger.warn("Firebase not configured, skipping push notification");
      return;
    }
    try {
      await messaging.send({
        token: fcmToken,
        notification: { title, body },
        data: data ?? {},
        android: {
          notification: {
            channelId: "temple_finance",
            priority: "high",
            sound: "default",
          },
        },
        apns: {
          payload: { aps: { badge: 1, sound: "default" } },
        },
      });
    } catch (error) {
      logger.error("Push notification failed:", error);
    }
  }

  async getUserNotifications(userId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const { count, rows } = await UserNotification.findAndCountAll({
      where: { userId },
      include: [{ model: Notification, as: "notification" }],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });
    return { count, rows };
  }

  async markAllRead(userId: string): Promise<void> {
    const now = new Date();
    await UserNotification.update(
      { isRead: true, readAt: now },
      { where: { userId, isRead: false } },
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return UserNotification.count({ where: { userId, isRead: false } });
  }
}

export const notificationService = new NotificationService();
