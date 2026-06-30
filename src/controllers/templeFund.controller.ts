import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { TempleFund } from "../models";
import { sequelize } from "../config/database";
import { sendSuccess, sendError } from "../utils/response";
import { auditService } from "../services/audit.service";

export class TempleFundController {
  async get(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      let fund = await TempleFund.findOne();
      if (!fund) {
        fund = await TempleFund.create({
          totalAmount: 0,
          availableAmount: 0,
          loanedAmount: 0,
        });
      }
      sendSuccess(res, fund);
    } catch (error) {
      next(error);
    }
  }

  async addFunds(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { amount } = req.body as { amount: number };
      if (!amount || amount <= 0) {
        sendError(res, "Amount must be positive", 400);
        return;
      }

      const fund = await sequelize.transaction(async (t) => {
        let f = await TempleFund.findOne({ transaction: t, lock: true });
        if (!f) {
          f = await TempleFund.create(
            { totalAmount: 0, availableAmount: 0, loanedAmount: 0 },
            { transaction: t },
          );
        }
        return f.update(
          {
            totalAmount: Number(f.totalAmount) + amount,
            availableAmount: Number(f.availableAmount) + amount,
          },
          { transaction: t },
        );
      });

      await auditService.log(
        req.user!.id,
        "ADD_FUNDS",
        "TempleFund",
        fund.id,
        undefined,
        { amount },
      );
      sendSuccess(res, fund, `₹${amount} added to temple fund`);
    } catch (error) {
      next(error);
    }
  }

  async withdrawFunds(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { amount, reason } = req.body as { amount: number; reason: string };
      if (!amount || amount <= 0) {
        sendError(res, "Amount must be positive", 400);
        return;
      }

      const fund = await sequelize.transaction(async (t) => {
        const f = await TempleFund.findOne({ transaction: t, lock: true });
        if (!f) throw new Error("Temple fund not found");
        if (Number(f.availableAmount) < amount) {
          throw new Error(
            `Insufficient funds. Available: ₹${f.availableAmount}`,
          );
        }
        return f.update(
          {
            totalAmount: Number(f.totalAmount) - amount,
            availableAmount: Number(f.availableAmount) - amount,
          },
          { transaction: t },
        );
      });

      await auditService.log(
        req.user!.id,
        "WITHDRAW_FUNDS",
        "TempleFund",
        fund.id,
        undefined,
        { amount, reason },
      );
      sendSuccess(res, fund, `₹${amount} withdrawn from temple fund`);
    } catch (error) {
      if (error instanceof Error) sendError(res, error.message, 400);
      else next(error);
    }
  }
}

export const templeFundController = new TempleFundController();
