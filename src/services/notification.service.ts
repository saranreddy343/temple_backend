import { Op } from "sequelize";
import { Notification, UserNotification, User, Loan, Expense } from "../models";
import { getMessaging } from "../config/firebase";
import { logger } from "../utils/logger";
import {
  LoanStatus,
  NotificationTargetType,
  NotificationStatus,
} from "../types";
import { getDaysUntilDue, formatDate, formatCurrency } from "../utils/helpers";

const FCM_MAX_RETRIES = 3;
const FCM_RETRY_BACKOFF_MS = 500;

// Non-retryable FCM error codes — invalid tokens should be cleaned up
const NON_RETRYABLE_CODES = new Set([
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
  "messaging/invalid-argument",
]);

interface BroadcastInput {
  title: string;
  message: string;
  type: string;
  targetType: NotificationTargetType;
  targetUserId?: string;
  createdBy: string;
  scheduledDate?: Date;
  /** Metadata forwarded to the FCM data payload for deep linking */
  data?: Record<string, string>;
}

export class NotificationService {
  // ─── Core broadcast ──────────────────────────────────────────────────────────

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
      data: input.data,
    });

    // Deliver asynchronously — don't block the caller
    this.deliverNotification(notification).catch((err) => {
      logger.error("deliverNotification error:", err);
    });

    return notification;
  }

  async deliverNotification(notification: Notification): Promise<void> {
    const users = await this.resolveTargetUsers(notification);

    if (users.length === 0) {
      await notification.update({ status: NotificationStatus.SENT });
      return;
    }

    // Persist user_notification rows
    await UserNotification.bulkCreate(
      users.map((u) => ({ notificationId: notification.id, userId: u.id })),
      { ignoreDuplicates: true },
    );

    // Build FCM data — merge notification data + meta
    const fcmData: Record<string, string> = {
      notificationId: notification.id,
      type: notification.type,
      ...(notification.data ?? {}),
    };

    let failedCount = 0;
    for (const user of users) {
      if (user.fcmToken) {
        const sent = await this.sendPushNotification(
          user.fcmToken,
          notification.title,
          notification.message,
          fcmData,
        );
        if (!sent) {
          failedCount++;
          // Invalidate stale token
          await user.update({ fcmToken: undefined }).catch(() => {});
        }
      }
    }

    await notification.update({
      status: failedCount === users.length && users.every((u) => u.fcmToken)
        ? NotificationStatus.FAILED
        : NotificationStatus.SENT,
      failedTokens: failedCount,
    });
  }

  private async resolveTargetUsers(
    notification: Notification,
  ): Promise<User[]> {
    switch (notification.targetType) {
      case NotificationTargetType.SPECIFIC_USER: {
        if (!notification.targetUserId) return [];
        const user = await User.findByPk(notification.targetUserId);
        return user ? [user] : [];
      }

      case NotificationTargetType.ADMINS_ONLY:
        return User.findAll({ where: { role: "ADMIN", isActive: true } });

      case NotificationTargetType.BORROWERS_ONLY:
        return User.findAll({ where: { role: "BORROWER", isActive: true } });

      case NotificationTargetType.ACTIVE_BORROWERS_WITH_LOANS: {
        const loans = await Loan.findAll({
          where: {
            status: { [Op.in]: [LoanStatus.ACTIVE, LoanStatus.DUE_SOON] },
          },
          attributes: ["borrowerId"],
        });
        const ids = [...new Set(loans.map((l) => l.borrowerId))];
        return User.findAll({ where: { id: ids, isActive: true } });
      }

      case NotificationTargetType.OVERDUE_BORROWERS: {
        const loans = await Loan.findAll({
          where: { status: LoanStatus.OVERDUE },
          attributes: ["borrowerId"],
        });
        const ids = [...new Set(loans.map((l) => l.borrowerId))];
        return User.findAll({ where: { id: ids, isActive: true } });
      }

      case NotificationTargetType.ALL:
      default:
        return User.findAll({ where: { isActive: true } });
    }
  }

  // ─── Event-driven notifications ───────────────────────────────────────────

  async sendLoanCreatedNotification(borrower: User, loan: Loan): Promise<void> {
    await this.broadcast({
      title: "Loan Sanctioned 🎉",
      message: `Loan ${loan.loanNumber} of ${formatCurrency(Number(loan.principalAmount))} sanctioned. Total repayable: ${formatCurrency(Number(loan.totalPayable))} by ${formatDate(loan.dueDate)}.`,
      type: "LOAN_CREATED",
      targetType: NotificationTargetType.SPECIFIC_USER,
      targetUserId: borrower.id,
      createdBy: loan.createdBy,
      data: { loanId: loan.id, screen: "LoanDetails" },
    });
  }

  async sendLoanClosedNotification(borrower: User, loan: Loan): Promise<void> {
    await this.broadcast({
      title: "Loan Closed ✅",
      message: `Your loan ${loan.loanNumber} is successfully closed. Payment of ${formatCurrency(Number(loan.totalPayable))} received. Thank you!`,
      type: "LOAN_CLOSED",
      targetType: NotificationTargetType.SPECIFIC_USER,
      targetUserId: borrower.id,
      createdBy: loan.updatedBy ?? loan.createdBy,
      data: { loanId: loan.id, screen: "LoanDetails" },
    });
  }

  async sendExpenseNotification(
    expense: Expense,
    adminId: string,
  ): Promise<void> {
    await this.broadcast({
      title: "Temple Expense Added 📋",
      message: `${expense.title}: ${formatCurrency(Number(expense.amount))} recorded under ${expense.category}.`,
      type: "EXPENSE_ADDED",
      targetType: NotificationTargetType.BORROWERS_ONLY,
      createdBy: adminId,
      data: { expenseId: expense.id, screen: "ExpenseDetails" },
    });
  }

  // ─── Loan reminders (cron-triggered) ──────────────────────────────────────

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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    for (const loan of activeLoans) {
      const daysUntilDue = getDaysUntilDue(loan.dueDate);
      const borrower = (loan as any).borrower as User;
      if (!borrower || !REMINDER_DAYS.includes(daysUntilDue)) continue;

      // Dedup per loan per day — not just per borrower per day
      const existing = await Notification.findOne({
        where: {
          type: "LOAN_REMINDER",
          targetUserId: borrower.id,
          createdAt: { [Op.gte]: today, [Op.lt]: tomorrow },
          data: { loanId: loan.id } as unknown as object,
        },
      });
      if (existing) continue;

      const amount = formatCurrency(Number(loan.totalPayable));
      const dueDateStr = formatDate(loan.dueDate);
      const remaining = `${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) !== 1 ? "s" : ""}`;

      let title: string;
      let message: string;

      if (daysUntilDue > 0) {
        title = "Loan Repayment Reminder ⏰";
        message = `${loan.loanNumber}: Repayment of ${amount} due on ${dueDateStr} (${remaining} remaining).`;
      } else if (daysUntilDue === 0) {
        title = "Loan Repayment Due Today 🔔";
        message = `${loan.loanNumber}: Your repayment of ${amount} is due TODAY. Please contact the temple administration.`;
      } else {
        title = "Loan Repayment Overdue ⚠️";
        message = `${loan.loanNumber}: Your repayment of ${amount} was due ${remaining} ago. Please contact the temple administration immediately.`;
      }

      await this.broadcast({
        title,
        message,
        type: "LOAN_REMINDER",
        targetType: NotificationTargetType.SPECIFIC_USER,
        targetUserId: borrower.id,
        createdBy: loan.createdBy,
        data: { loanId: loan.id, screen: "LoanDetails" },
      });
    }

    logger.info(`Loan reminders processed for ${activeLoans.length} loans`);
  }

  // ─── FCM push with retry ───────────────────────────────────────────────────

  /**
   * Sends an FCM push message. Returns `true` on success, `false` on failure.
   * Retries up to FCM_MAX_RETRIES times with exponential backoff.
   * Non-retryable errors (invalid token) fail immediately.
   */
  async sendPushNotification(
    fcmToken: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<boolean> {
    const messaging = getMessaging();
    if (!messaging) {
      logger.warn("Firebase not configured — skipping push notification");
      return false;
    }

    const message = {
      token: fcmToken,
      notification: { title, body },
      data: data ?? {},
      android: {
        notification: {
          channelId: "temple_finance",
          priority: "high" as const,
          sound: "default",
        },
        priority: "high" as const,
      },
      apns: {
        headers: { "apns-priority": "10" },
        payload: { aps: { badge: 1, sound: "default", contentAvailable: true } },
      },
    };

    for (let attempt = 1; attempt <= FCM_MAX_RETRIES; attempt++) {
      try {
        await messaging.send(message);
        return true;
      } catch (error: unknown) {
        const code = (error as { code?: string }).code ?? "";
        if (NON_RETRYABLE_CODES.has(code)) {
          logger.warn(`FCM non-retryable error (token invalidated): ${code}`);
          return false;
        }
        if (attempt < FCM_MAX_RETRIES) {
          const delay = FCM_RETRY_BACKOFF_MS * Math.pow(2, attempt - 1);
          logger.warn(`FCM attempt ${attempt} failed (${code}), retrying in ${delay}ms…`);
          await new Promise((r) => setTimeout(r, delay));
        } else {
          logger.error(`FCM failed after ${FCM_MAX_RETRIES} attempts:`, error);
          return false;
        }
      }
    }
    return false;
  }

  // ─── Query helpers ─────────────────────────────────────────────────────────

  async getUserNotifications(
    userId: string,
    page: number,
    limit: number,
    type?: string,
  ) {
    const offset = (page - 1) * limit;
    const notifWhere = type ? { type } : {};
    const { count, rows } = await UserNotification.findAndCountAll({
      where: { userId },
      include: [{
        model: Notification,
        as: "notification",
        where: notifWhere,
        required: true,
      }],
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

  async markOpened(userNotifId: string, userId: string): Promise<void> {
    await UserNotification.update(
      { isRead: true, readAt: new Date(), openedAt: new Date() },
      { where: { id: userNotifId, userId } },
    );
  }

  async deleteUserNotification(userNotifId: string, userId: string): Promise<boolean> {
    const rows = await UserNotification.destroy({
      where: { id: userNotifId, userId },
    });
    return rows > 0;
  }

  async getUnreadCount(userId: string): Promise<number> {
    return UserNotification.count({ where: { userId, isRead: false } });
  }

  async getAdminStats(adminId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [sentToday, failed, pending] = await Promise.all([
      Notification.count({
        where: {
          createdBy: adminId,
          status: NotificationStatus.SENT,
          createdAt: { [Op.gte]: today },
        },
      }),
      Notification.count({
        where: { createdBy: adminId, status: NotificationStatus.FAILED },
      }),
      Notification.count({
        where: { createdBy: adminId, status: NotificationStatus.PENDING },
      }),
    ]);

    const totalUnread = await UserNotification.count({ where: { isRead: false } });

    return { sentToday, failed, pending, totalUnread };
  }
}

export const notificationService = new NotificationService();
