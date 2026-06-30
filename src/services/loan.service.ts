import { Op } from "sequelize";
import { sequelize } from "../config/database";
import { Loan, LoanPayment, TempleFund, User } from "../models";
import { LoanStatus, PaymentMethod } from "../types";
import {
  calculateLoan,
  generateLoanNumber,
  getDaysUntilDue,
} from "../utils/helpers";
import { auditService } from "./audit.service";
import { notificationService } from "./notification.service";

interface CreateLoanInput {
  borrowerId: string;
  loanNumber?: string;
  bondNumber?: string;
  principalAmount: number;
  interestRate: number;
  loanDate: Date;
  durationMonths: number;
  remarks?: string;
  adminId: string;
}

interface UpdateLoanInput {
  loanId: string;
  loanNumber?: string;
  bondNumber?: string | null;
  principalAmount?: number;
  interestRate?: number;
  durationMonths?: number;
  remarks?: string | null;
  adminId: string;
}

interface CloseLoanInput {
  loanId: string;
  paymentMethod: PaymentMethod;
  paymentDate: Date;
  remarks?: string;
  adminId: string;
}

export class LoanService {
  async createLoan(input: CreateLoanInput): Promise<Loan> {
    return sequelize.transaction(async (t) => {
      const fund = await TempleFund.findOne({ transaction: t, lock: true });
      if (!fund) throw new Error("Temple fund not initialized");
      if (Number(fund.availableAmount) < input.principalAmount) {
        throw new Error(
          `Insufficient temple fund. Available: ₹${fund.availableAmount}, Requested: ₹${input.principalAmount}`,
        );
      }

      const borrower = await User.findByPk(input.borrowerId, {
        transaction: t,
      });
      if (!borrower) throw new Error("Borrower not found");

      const loanNumber = input.loanNumber?.trim() || generateLoanNumber();
      const { monthlyInterest, totalInterest, totalPayable, dueDate } =
        calculateLoan(
          input.principalAmount,
          input.interestRate,
          input.durationMonths,
          new Date(input.loanDate),
        );

      const loan = await Loan.create(
        {
          borrowerId: input.borrowerId,
          loanNumber,
          bondNumber: input.bondNumber?.trim() || undefined,
          principalAmount: input.principalAmount,
          interestRate: input.interestRate,
          loanDate: input.loanDate,
          dueDate,
          durationMonths: input.durationMonths,
          status: LoanStatus.ACTIVE,
          monthlyInterest,
          totalInterest,
          totalPayable,
          remainingBalance: totalPayable,
          createdBy: input.adminId,
          remarks: input.remarks,
        },
        { transaction: t },
      );

      await fund.update(
        {
          availableAmount: Number(fund.availableAmount) - input.principalAmount,
          loanedAmount: Number(fund.loanedAmount) + input.principalAmount,
        },
        { transaction: t },
      );

      await auditService.log(
        input.adminId,
        "CREATE_LOAN",
        "Loan",
        loan.id,
        undefined,
        {
          loanNumber,
          bondNumber: input.bondNumber,
          principalAmount: input.principalAmount,
          durationMonths: input.durationMonths,
          totalPayable,
        },
      );

      await notificationService.sendLoanCreatedNotification(borrower, loan);
      return loan;
    });
  }


  async updateLoan(input: UpdateLoanInput): Promise<Loan> {
    return sequelize.transaction(async (t) => {
      const loan = await Loan.findByPk(input.loanId, { transaction: t, lock: true });
      if (!loan) throw new Error("Loan not found");
      if (loan.status === LoanStatus.COMPLETED) throw new Error("Completed loans cannot be edited");
      if (loan.status === LoanStatus.CANCELLED) throw new Error("Cancelled loans cannot be edited");

      const oldValues = loan.toJSON();
      const principalAmount = input.principalAmount ?? Number(loan.principalAmount);
      const interestRate = input.interestRate ?? Number(loan.interestRate);
      const durationMonths = input.durationMonths ?? Number(loan.durationMonths);
      const { monthlyInterest, totalInterest, totalPayable, dueDate } = calculateLoan(
        principalAmount,
        interestRate,
        durationMonths,
        new Date(loan.loanDate),
      );

      const principalDelta = principalAmount - Number(loan.principalAmount);
      if (principalDelta !== 0) {
        const fund = await TempleFund.findOne({ transaction: t, lock: true });
        if (!fund) throw new Error("Temple fund not initialized");
        if (principalDelta > 0 && Number(fund.availableAmount) < principalDelta) {
          throw new Error(
            `Insufficient temple fund. Available: ₹${fund.availableAmount}, Additional required: ₹${principalDelta}`,
          );
        }
        await fund.update(
          {
            availableAmount: Number(fund.availableAmount) - principalDelta,
            loanedAmount: Number(fund.loanedAmount) + principalDelta,
          },
          { transaction: t },
        );
      }

      const updates: Partial<{
        loanNumber: string;
        bondNumber: string;
        principalAmount: number;
        interestRate: number;
        durationMonths: number;
        dueDate: Date;
        monthlyInterest: number;
        totalInterest: number;
        totalPayable: number;
        remainingBalance: number;
        remarks: string;
        updatedBy: string;
      }> = {
          loanNumber: input.loanNumber?.trim() || loan.loanNumber,
          bondNumber: input.bondNumber === undefined ? loan.bondNumber : input.bondNumber?.trim() || undefined,
          principalAmount,
          interestRate,
          durationMonths,
          dueDate,
          monthlyInterest,
          totalInterest,
          totalPayable,
          remainingBalance: totalPayable,
          remarks: input.remarks === undefined ? loan.remarks : input.remarks?.trim() || undefined,
          updatedBy: input.adminId,
      };

      await loan.update(updates, { transaction: t });

      await auditService.log(input.adminId, "UPDATE_LOAN", "Loan", loan.id, oldValues, loan.toJSON());
      return loan;
    });
  }


  async closeLoan(input: CloseLoanInput): Promise<LoanPayment> {
    return sequelize.transaction(async (t) => {
      const loan = await Loan.findByPk(input.loanId, {
        transaction: t,
        lock: true,
        include: [{ model: User, as: "borrower" }],
      });
      if (!loan) throw new Error("Loan not found");
      if (loan.status === LoanStatus.COMPLETED)
        throw new Error("Loan is already completed");
      if (loan.status === LoanStatus.CANCELLED)
        throw new Error("Loan is cancelled");

      const payment = await LoanPayment.create(
        {
          loanId: loan.id,
          principalAmount: Number(loan.principalAmount),
          interestAmount: Number(loan.totalInterest),
          totalPaid: Number(loan.totalPayable),
          paymentDate: input.paymentDate,
          paymentMethod: input.paymentMethod,
          collectedBy: input.adminId,
          remarks: input.remarks,
        },
        { transaction: t },
      );

      await loan.update(
        {
          status: LoanStatus.COMPLETED,
          remainingBalance: 0,
          closedDate: input.paymentDate,
          updatedBy: input.adminId,
        },
        { transaction: t },
      );

      const fund = await TempleFund.findOne({ transaction: t, lock: true });
      if (fund) {
        await fund.update(
          {
            totalAmount: Number(fund.totalAmount) + Number(loan.totalInterest),
            availableAmount:
              Number(fund.availableAmount) + Number(loan.totalPayable),
            loanedAmount: Math.max(
              0,
              Number(fund.loanedAmount) - Number(loan.principalAmount),
            ),
          },
          { transaction: t },
        );
      }

      await auditService.log(
        input.adminId,
        "CLOSE_LOAN",
        "Loan",
        loan.id,
        { status: loan.status },
        {
          status: LoanStatus.COMPLETED,
          totalPaid: loan.totalPayable,
          closedDate: input.paymentDate,
        },
      );

      const borrower = (loan as any).borrower as User;
      if (borrower) {
        await notificationService.sendLoanClosedNotification(borrower, loan);
      }

      return payment;
    });
  }

  async cancelLoan(
    loanId: string,
    adminId: string,
    reason?: string,
  ): Promise<Loan> {
    return sequelize.transaction(async (t) => {
      const loan = await Loan.findByPk(loanId, { transaction: t, lock: true });
      if (!loan) throw new Error("Loan not found");
      if (loan.status === LoanStatus.COMPLETED)
        throw new Error("Cannot cancel a completed loan");
      if (loan.status === LoanStatus.CANCELLED)
        throw new Error("Loan is already cancelled");

      const oldStatus = loan.status;
      await loan.update(
        { status: LoanStatus.CANCELLED, updatedBy: adminId, remarks: reason },
        { transaction: t },
      );

      const fund = await TempleFund.findOne({ transaction: t, lock: true });
      if (fund) {
        await fund.update(
          {
            availableAmount:
              Number(fund.availableAmount) + Number(loan.principalAmount),
            loanedAmount: Math.max(
              0,
              Number(fund.loanedAmount) - Number(loan.principalAmount),
            ),
          },
          { transaction: t },
        );
      }

      await auditService.log(
        adminId,
        "CANCEL_LOAN",
        "Loan",
        loanId,
        { status: oldStatus },
        { status: LoanStatus.CANCELLED },
      );
      return loan;
    });
  }

  async updateLoanStatuses(): Promise<void> {
    const activeLoans = await Loan.findAll({
      where: {
        status: {
          [Op.in]: [LoanStatus.ACTIVE, LoanStatus.DUE_SOON, LoanStatus.OVERDUE],
        },
      },
    });

    for (const loan of activeLoans) {
      const daysUntilDue = getDaysUntilDue(loan.dueDate);
      let newStatus: LoanStatus = LoanStatus.ACTIVE;

      if (daysUntilDue < 0) {
        newStatus = LoanStatus.OVERDUE;
      } else if (daysUntilDue <= 7) {
        newStatus = LoanStatus.DUE_SOON;
      }

      if (newStatus !== loan.status) {
        await loan.update({ status: newStatus });
      }
    }
  }
}

export const loanService = new LoanService();
