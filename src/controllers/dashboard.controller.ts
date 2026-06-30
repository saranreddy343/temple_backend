import { Response, NextFunction } from "express";
import { fn, col, Op } from "sequelize";
import { Loan, User, Expense, TempleFund, LoanPayment } from "../models";
import { AuthenticatedRequest, LoanStatus, UserRole } from "../types";
import { sendSuccess, sendError } from "../utils/response";

export class DashboardController {
  async adminStats(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const activeStatuses = [LoanStatus.ACTIVE, LoanStatus.DUE_SOON, LoanStatus.OVERDUE];

      const [
        fund,
        activeLoans,
        activeBorrowers,
        overdueLoans,
        dueSoonLoans,
        threeMonthLoans,
        sixMonthLoans,
        expectedReturnAmount,
        totalExpenses,
        monthExpenses,
      ] = await Promise.all([
        TempleFund.findOne(),
        Loan.count({ where: { status: { [Op.in]: activeStatuses } } }),
        Loan.count({ distinct: true, col: "borrowerId", where: { status: { [Op.in]: activeStatuses } } }),
        Loan.count({ where: { status: LoanStatus.OVERDUE } }),
        Loan.count({ where: { status: LoanStatus.DUE_SOON } }),
        Loan.count({ where: { durationMonths: 3, status: { [Op.in]: activeStatuses } } }),
        Loan.count({ where: { durationMonths: 6, status: { [Op.in]: activeStatuses } } }),
        Loan.sum("totalPayable", { where: { status: { [Op.in]: activeStatuses } } }),
        Expense.sum("amount"),
        Expense.sum("amount", {
          where: { expenseDate: { [Op.between]: [monthStart, monthEnd] } },
        }),
      ]);

      const totalLoanedAmount = await Loan.sum("principalAmount", {
        where: {
          status: {
            [Op.in]: activeStatuses,
          },
        },
      });

      sendSuccess(res, {
        totalTempleFund: Number(fund?.totalAmount ?? 0),
        availableFund: Number(fund?.availableAmount ?? 0),
        totalLoanedAmount: Number(totalLoanedAmount ?? 0),
        distributedAmount: Number(totalLoanedAmount ?? 0),
        expectedReturnAmount: Number(expectedReturnAmount ?? 0),
        activeLoans,
        activeBorrowers,
        overdueLoans,
        dueSoonLoans,
        threeMonthLoans,
        sixMonthLoans,
        totalExpenses: Number(totalExpenses ?? 0),
        currentMonthExpenses: Number(monthExpenses ?? 0),
      });
    } catch (error) {
      next(error);
    }
  }

  async borrowerStats(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const activeStatuses = [LoanStatus.ACTIVE, LoanStatus.DUE_SOON, LoanStatus.OVERDUE];

      const activeLoans = await Loan.findAll({
        where: {
          borrowerId: userId,
          status: {
            [Op.in]: activeStatuses,
          },
        },
        order: [["dueDate", "ASC"]],
      });

      const completedLoans = await Loan.count({
        where: { borrowerId: userId, status: LoanStatus.COMPLETED },
      });

      const totalOutstanding = activeLoans.reduce(
        (sum, l) => sum + Number(l.remainingBalance),
        0,
      );

      const nextDueLoan = activeLoans[0] ?? null;

      sendSuccess(res, {
        activeLoansCount: activeLoans.length,
        completedLoansCount: completedLoans,
        totalOutstanding,
        nextDueLoan: nextDueLoan
          ? {
              loanId: nextDueLoan.id,
              loanNumber: nextDueLoan.loanNumber,
              totalPayable: Number(nextDueLoan.totalPayable),
              dueDate: nextDueLoan.dueDate,
              status: nextDueLoan.status,
            }
          : null,
        activeLoans: activeLoans.map((l) => ({
          loanId: l.id,
          loanNumber: l.loanNumber,
          principalAmount: Number(l.principalAmount),
          totalPayable: Number(l.totalPayable),
          remainingBalance: Number(l.remainingBalance),
          dueDate: l.dueDate,
          status: l.status,
          durationMonths: l.durationMonths,
          interestRate: Number(l.interestRate),
          monthlyInterest: Number(l.monthlyInterest),
          totalInterest: Number(l.totalInterest),
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  async loanDistribution(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const distribution = await Loan.findAll({
        attributes: [
          "status",
          [fn("COUNT", col("id")), "count"],
          [fn("SUM", col("principalAmount")), "totalAmount"],
        ],
        group: ["status"],
        raw: true,
      });
      sendSuccess(res, distribution);
    } catch (error) {
      next(error);
    }
  }

  async expenseTrend(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const year = parseInt(
        (req.query["year"] as string) ?? String(new Date().getFullYear()),
      );
      const expenses = await Expense.findAll({
        attributes: [
          "category",
          [fn("SUM", col("amount")), "total"],
          [fn("COUNT", col("id")), "count"],
        ],
        where: {
          expenseDate: {
            [Op.between]: [new Date(year, 0, 1), new Date(year, 11, 31)],
          },
        },
        group: ["category"],
        raw: true,
      });
      sendSuccess(res, expenses);
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
