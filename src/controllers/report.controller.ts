import { Response, NextFunction } from "express";
import { AuthenticatedRequest, LoanStatus } from "../types";
import { sendSuccess } from "../utils/response";
import { reportService } from "../services/report.service";

export class ReportController {
  async getLoanReport(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { status, borrowerId, startDate, endDate, format } = req.query as {
        status?: LoanStatus;
        borrowerId?: string;
        startDate?: string;
        endDate?: string;
        format?: "json" | "pdf" | "excel";
      };

      const loans = await reportService.getLoanReport({
        status,
        borrowerId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });

      if (format === "pdf") {
        const buffer = await reportService.generateLoanReportPDF(loans);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=loan-report.pdf");
        res.send(buffer);
        return;
      }

      if (format === "excel") {
        const buffer = await reportService.generateLoanReportExcel(loans);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", "attachment; filename=loan-report.xlsx");
        res.send(buffer);
        return;
      }

      sendSuccess(res, loans);
    } catch (error) {
      next(error);
    }
  }

  async getPaymentReport(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { startDate, endDate, format } = req.query as {
        startDate?: string;
        endDate?: string;
        format?: "json" | "pdf" | "excel";
      };

      const payments = await reportService.getPaymentReport({
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });

      if (format === "pdf") {
        const buffer = await reportService.generatePaymentReportPDF(payments);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=payment-report.pdf");
        res.send(buffer);
        return;
      }

      if (format === "excel") {
        const buffer = await reportService.generatePaymentReportExcel(payments);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", "attachment; filename=payment-report.xlsx");
        res.send(buffer);
        return;
      }

      sendSuccess(res, payments);
    } catch (error) {
      next(error);
    }
  }

  async getExpenseReport(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { startDate, endDate, format } = req.query as {
        startDate?: string;
        endDate?: string;
        format?: "json" | "pdf" | "excel";
      };

      const expenses = await reportService.getExpenseReport({
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });

      if (format === "pdf") {
        const buffer = await reportService.generateExpenseReportPDF(expenses);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=expense-report.pdf");
        res.send(buffer);
        return;
      }

      if (format === "excel") {
        const buffer = await reportService.generateExpenseReportExcel(expenses);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", "attachment; filename=expense-report.xlsx");
        res.send(buffer);
        return;
      }

      sendSuccess(res, expenses);
    } catch (error) {
      next(error);
    }
  }

  async getOverdueReport(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const loans = await reportService.getOverdueLoanReport();
      sendSuccess(res, loans);
    } catch (error) {
      next(error);
    }
  }

  async getBorrowerReport(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { borrowerId } = req.params;
      const loans = await reportService.getLoanReport({ borrowerId });
      sendSuccess(res, loans);
    } catch (error) {
      next(error);
    }
  }
}

export const reportController = new ReportController();
