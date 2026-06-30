import { Response, NextFunction } from "express";
import { Op } from "sequelize";
import { Loan, User, LoanPayment } from "../models";
import { AuthenticatedRequest, LoanStatus, UserRole } from "../types";
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
import { loanService } from "../services/loan.service";

export class LoanController {
  async getAll(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { page, limit, offset } = getPaginationOptions(req);
      const {
        status,
        search,
        sortBy = "createdAt",
        sortOrder = "DESC",
      } = req.query as {
        status?: LoanStatus;
        search?: string;
        sortBy?: string;
        sortOrder?: "ASC" | "DESC";
      };

      const where: Record<string | symbol, unknown> = {};
      if (status) where["status"] = status;

      if (req.user?.role === UserRole.BORROWER) {
        where["borrowerId"] = req.user.id;
      }

      if (search) {
        where[Op.or] = [
          { loanNumber: { [Op.iLike]: `%${search}%` } },
          { bondNumber: { [Op.iLike]: `%${search}%` } },
          { "$borrower.name$": { [Op.iLike]: `%${search}%` } },
          { "$borrower.mobile$": { [Op.iLike]: `%${search}%` } },
        ];
      }

      const includeOptions = [
        {
          model: User,
          as: "borrower",
          attributes: ["id", "name", "mobile", "address"],
          required: Boolean(search),
        },
      ];

      const { count, rows } = await Loan.findAndCountAll({
        where,
        include: includeOptions,
        limit,
        offset,
        order: [[sortBy, sortOrder]],
        subQuery: false,
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
      const loan = await Loan.findByPk(req.params["id"], {
        include: [
          {
            model: User,
            as: "borrower",
            attributes: ["id", "name", "mobile", "address"],
          },
          { model: User, as: "creator", attributes: ["id", "name"] },
          {
            model: LoanPayment,
            as: "payments",
            order: [["paymentDate", "DESC"]] as [string, string][],
          },
        ],
      });

      if (!loan) {
        sendNotFound(res, "Loan not found");
        return;
      }

      if (
        req.user?.role === UserRole.BORROWER &&
        loan.borrowerId !== req.user.id
      ) {
        sendError(res, "Access denied", 403);
        return;
      }

      sendSuccess(res, loan);
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
      const loan = await loanService.createLoan({
        ...(req.body as Parameters<typeof loanService.createLoan>[0]),
        adminId: req.user!.id,
      });
      sendCreated(res, loan, "Loan created successfully");
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
      const loan = await loanService.updateLoan({
        ...(req.body as Omit<Parameters<typeof loanService.updateLoan>[0], "loanId" | "adminId">),
        loanId: req.params["id"],
        adminId: req.user!.id,
      });
      sendSuccess(res, loan, "Loan updated successfully");
    } catch (error) {
      if (error instanceof Error) sendError(res, error.message, 400);
      else next(error);
    }
  }

  async closeLoan(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const payment = await loanService.closeLoan({
        loanId: req.params["id"],
        ...(req.body as {
          paymentMethod: any;
          paymentDate: Date;
          remarks?: string;
        }),
        adminId: req.user!.id,
      });
      sendCreated(res, payment, "Loan closed successfully");
    } catch (error) {
      if (error instanceof Error) sendError(res, error.message, 400);
      else next(error);
    }
  }

  async cancelLoan(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const loan = await loanService.cancelLoan(
        req.params["id"],
        req.user!.id,
        req.body?.reason,
      );
      sendSuccess(res, loan, "Loan cancelled");
    } catch (error) {
      if (error instanceof Error) sendError(res, error.message, 400);
      else next(error);
    }
  }

  async getPayments(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const payments = await LoanPayment.findAll({
        where: { loanId: req.params["id"] },
        include: [{ model: User, as: "collector", attributes: ["id", "name"] }],
        order: [["paymentDate", "DESC"]],
      });
      sendSuccess(res, payments);
    } catch (error) {
      next(error);
    }
  }
}

export const loanController = new LoanController();
