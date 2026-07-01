import { Response, NextFunction } from "express";
import { AuthenticatedRequest, ExpenseCategory } from "../types";
import { sendSuccess, sendCreated, sendError } from "../utils/response";
import { expenseService } from "../services/expense.service";
import { notificationService } from "../services/notification.service";
import { Expense, User } from "../models";

export class ExpenseController {
  async getAll(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const {
        category,
        startDate,
        endDate,
        page = "1",
        limit = "20",
      } = req.query as Record<string, string>;

      const result = await expenseService.getExpenses({
        category: category as ExpenseCategory | undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        page: parseInt(page),
        limit: parseInt(limit),
      });

      sendSuccess(res, result);
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
      const expense = await Expense.findByPk(req.params["id"], {
        include: [{ model: User, as: "creator", attributes: ["id", "name"] }],
      });
      if (!expense) {
        sendError(res, "Expense not found", 404);
        return;
      }
      sendSuccess(res, expense);
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
      const expense = await expenseService.createExpense({
        ...(req.body as Parameters<typeof expenseService.createExpense>[0]),
        adminId: req.user!.id,
      });
      sendCreated(res, expense, "Expense recorded successfully");
      // Fire-and-forget notification to all borrowers
      notificationService.sendExpenseNotification(expense, req.user!.id).catch(() => {});
    } catch (error) {
      if (error instanceof Error) sendError(res, error.message, 400);
      else next(error);
    }
  }

  async update(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const expense = await expenseService.updateExpense({
        expenseId: req.params["id"],
        ...(req.body as any),
        adminId: req.user!.id,
      });
      sendSuccess(res, expense, "Expense updated");
    } catch (error) {
      if (error instanceof Error) sendError(res, error.message, 400);
      else next(error);
    }
  }

  async getSummary(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { year = String(new Date().getFullYear()), month } =
        req.query as Record<string, string>;
      const summary = await expenseService.getSummary(
        parseInt(year),
        month ? parseInt(month) : undefined,
      );
      sendSuccess(res, summary);
    } catch (error) {
      next(error);
    }
  }
}

export const expenseController = new ExpenseController();
