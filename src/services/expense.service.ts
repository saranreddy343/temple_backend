import { Op, WhereOptions } from "sequelize";
import { sequelize } from "../config/database";
import { Expense, TempleFund, User } from "../models";
import { ExpenseCategory } from "../types";
import { auditService } from "./audit.service";

interface CreateExpenseInput {
  title: string;
  description?: string;
  category: ExpenseCategory;
  amount: number;
  expenseDate: Date;
  receiptImage?: string;
  adminId: string;
}

interface UpdateExpenseInput extends Partial<CreateExpenseInput> {
  expenseId: string;
  adminId: string;
}

interface ExpenseFilters {
  category?: ExpenseCategory;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export class ExpenseService {
  async createExpense(input: CreateExpenseInput): Promise<Expense> {
    return sequelize.transaction(async (t) => {
      const expense = await Expense.create(
        {
          title: input.title,
          description: input.description,
          category: input.category,
          amount: input.amount,
          expenseDate: input.expenseDate,
          receiptImage: input.receiptImage,
          createdBy: input.adminId,
        },
        { transaction: t },
      );

      // Deduct from temple fund available amount
      const fund = await TempleFund.findOne({ transaction: t, lock: true });
      if (fund) {
        await fund.update(
          {
            totalAmount: Math.max(0, Number(fund.totalAmount) - input.amount),
            availableAmount: Math.max(
              0,
              Number(fund.availableAmount) - input.amount,
            ),
          },
          { transaction: t },
        );
      }

      await auditService.log(
        input.adminId,
        "CREATE_EXPENSE",
        "Expense",
        expense.id,
        undefined,
        { title: input.title, amount: input.amount, category: input.category },
      );

      return expense;
    });
  }

  async updateExpense(input: UpdateExpenseInput): Promise<Expense> {
    return sequelize.transaction(async (t) => {
      const expense = await Expense.findByPk(input.expenseId, {
        transaction: t,
      });
      if (!expense) throw new Error("Expense not found");

      const oldAmount = Number(expense.amount);
      const newAmount = input.amount ?? oldAmount;
      const diff = newAmount - oldAmount;

      const oldValues = expense.toJSON();

      const { expenseId, adminId, ...updateFields } = input;
      await expense.update(
        { ...updateFields, updatedBy: adminId },
        { transaction: t },
      );

      // Adjust fund if amount changed
      if (diff !== 0) {
        const fund = await TempleFund.findOne({ transaction: t, lock: true });
        if (fund) {
          await fund.update(
            {
              totalAmount: Math.max(0, Number(fund.totalAmount) - diff),
              availableAmount: Math.max(0, Number(fund.availableAmount) - diff),
            },
            { transaction: t },
          );
        }
      }

      await auditService.log(
        input.adminId,
        "UPDATE_EXPENSE",
        "Expense",
        expense.id,
        oldValues,
        expense.toJSON(),
      );

      return expense;
    });
  }

  async getExpenses(filters: ExpenseFilters) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    const where: WhereOptions = {};
    if (filters.category) where["category"] = filters.category;
    if (filters.startDate || filters.endDate) {
      const dateRange: Record<symbol, Date> = {};
      if (filters.startDate) dateRange[Op.gte] = filters.startDate;
      if (filters.endDate) dateRange[Op.lte] = filters.endDate;
      where["expenseDate"] = dateRange;
    }

    const { count, rows } = await Expense.findAndCountAll({
      where,
      include: [{ model: User, as: "creator", attributes: ["id", "name"] }],
      order: [["expenseDate", "DESC"]],
      limit,
      offset,
    });

    return { count, rows, page, limit };
  }

  async getSummary(year: number, month?: number) {
    const where: WhereOptions = {};
    if (month) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      where["expenseDate"] = { [Op.between]: [start, end] };
    } else {
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31);
      where["expenseDate"] = { [Op.between]: [start, end] };
    }

    const expenses = await Expense.findAll({ where });
    const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    const byCategory: Record<string, number> = {};
    for (const e of expenses) {
      byCategory[e.category] = (byCategory[e.category] ?? 0) + Number(e.amount);
    }

    return { total, byCategory, count: expenses.length };
  }
}

export const expenseService = new ExpenseService();
