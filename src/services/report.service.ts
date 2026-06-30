import PDFDocument from "pdfkit";
import * as XLSX from "xlsx";
import { Op } from "sequelize";
import { Loan, LoanPayment, Expense, User } from "../models";
import { LoanStatus } from "../types";

interface ReportFilters {
  status?: LoanStatus;
  borrowerId?: string;
  startDate?: Date;
  endDate?: Date;
  year?: number;
  month?: number;
}

export class ReportService {
  // ─────────────────────────────────────────────
  // Data fetch helpers
  // ─────────────────────────────────────────────

  async getLoanReport(filters: ReportFilters): Promise<InstanceType<typeof Loan>[]> {
    const where: Record<string, unknown> = {};
    if (filters.status) where["status"] = filters.status;
    if (filters.borrowerId) where["borrowerId"] = filters.borrowerId;
    if (filters.startDate || filters.endDate) {
      where["loanDate"] = {};
      if (filters.startDate) (where["loanDate"] as any)[Op.gte] = filters.startDate;
      if (filters.endDate) (where["loanDate"] as any)[Op.lte] = filters.endDate;
    }

    return Loan.findAll({
      where,
      include: [
        { model: User, as: "borrower", attributes: ["id", "name", "mobile", "address"] },
        { model: LoanPayment, as: "payments" },
      ],
      order: [["createdAt", "DESC"]],
    });
  }

  async getPaymentReport(filters: ReportFilters): Promise<InstanceType<typeof LoanPayment>[]> {
    const where: Record<string, unknown> = {};
    if (filters.startDate || filters.endDate) {
      where["paymentDate"] = {};
      if (filters.startDate) (where["paymentDate"] as any)[Op.gte] = filters.startDate;
      if (filters.endDate) (where["paymentDate"] as any)[Op.lte] = filters.endDate;
    }

    return LoanPayment.findAll({
      where,
      include: [
        {
          model: Loan,
          as: "loan",
          include: [
            { model: User, as: "borrower", attributes: ["id", "name", "mobile"] },
          ],
        },
      ],
      order: [["paymentDate", "DESC"]],
    });
  }

  async getExpenseReport(filters: ReportFilters): Promise<InstanceType<typeof Expense>[]> {
    const where: Record<string, unknown> = {};
    if (filters.startDate || filters.endDate) {
      where["expenseDate"] = {};
      if (filters.startDate) (where["expenseDate"] as any)[Op.gte] = filters.startDate;
      if (filters.endDate) (where["expenseDate"] as any)[Op.lte] = filters.endDate;
    }

    return Expense.findAll({
      where,
      order: [["expenseDate", "DESC"]],
    });
  }

  async getOverdueLoanReport(): Promise<InstanceType<typeof Loan>[]> {
    return Loan.findAll({
      where: { status: "OVERDUE" },
      include: [
        { model: User, as: "borrower", attributes: ["id", "name", "mobile", "address"] },
      ],
      order: [["dueDate", "ASC"]],
    });
  }

  // ─────────────────────────────────────────────
  // PDF generators
  // ─────────────────────────────────────────────

  private pdfHeader(doc: PDFKit.PDFDocument, subtitle: string): void {
    doc.fontSize(20).fillColor("#5EBEA5").text("Temple Finance Management", { align: "center" });
    doc.fontSize(14).fillColor("#2C3E50").text(subtitle, { align: "center" });
    doc.moveDown();
    doc.fontSize(10).fillColor("#666")
      .text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, { align: "right" });
    doc.moveDown();
  }

  async generateLoanReportPDF(loans: InstanceType<typeof Loan>[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const chunks: Buffer[] = [];
      doc.on("data", (c: Buffer) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      this.pdfHeader(doc, "Loan Report");

      const tableTop = doc.y;
      const col = { loan: 50, borrower: 120, principal: 220, rate: 295, payable: 345, status: 415, due: 460 };

      doc.fontSize(9).fillColor("#fff").rect(50, tableTop, 505, 20).fill("#5EBEA5");
      doc.fillColor("#fff")
        .text("Loan #", col.loan, tableTop + 5)
        .text("Borrower", col.borrower, tableTop + 5)
        .text("Principal", col.principal, tableTop + 5)
        .text("Rate%", col.rate, tableTop + 5)
        .text("Total Payable", col.payable, tableTop + 5)
        .text("Status", col.status, tableTop + 5)
        .text("Due Date", col.due, tableTop + 5);

      let y = tableTop + 25;
      for (const [idx, loan] of loans.entries()) {
        if (y > 700) { doc.addPage(); y = 50; }
        const bg = idx % 2 === 0 ? "#F8FAFC" : "#fff";
        doc.rect(50, y - 3, 505, 18).fill(bg);
        const borrower = (loan as any).borrower;
        doc.fillColor("#333").fontSize(8)
          .text(loan.loanNumber, col.loan, y)
          .text(borrower?.name ?? "-", col.borrower, y)
          .text(`₹${Number(loan.principalAmount).toLocaleString("en-IN")}`, col.principal, y)
          .text(`${loan.interestRate}%`, col.rate, y)
          .text(`₹${Number(loan.totalPayable).toLocaleString("en-IN")}`, col.payable, y)
          .text(loan.status, col.status, y)
          .text(new Date(loan.dueDate).toLocaleDateString("en-IN"), col.due, y);
        y += 18;
      }

      doc.end();
    });
  }

  async generatePaymentReportPDF(payments: InstanceType<typeof LoanPayment>[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const chunks: Buffer[] = [];
      doc.on("data", (c: Buffer) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      this.pdfHeader(doc, "Loan Payment Report");

      const tableTop = doc.y;
      const col = { loan: 50, borrower: 130, principal: 230, interest: 300, total: 370, method: 430, date: 490 };

      doc.fontSize(9).fillColor("#fff").rect(50, tableTop, 505, 20).fill("#5EBEA5");
      doc.fillColor("#fff")
        .text("Loan #", col.loan, tableTop + 5)
        .text("Borrower", col.borrower, tableTop + 5)
        .text("Principal", col.principal, tableTop + 5)
        .text("Interest", col.interest, tableTop + 5)
        .text("Total Paid", col.total, tableTop + 5)
        .text("Method", col.method, tableTop + 5)
        .text("Date", col.date, tableTop + 5);

      let y = tableTop + 25;
      for (const [idx, p] of payments.entries()) {
        if (y > 700) { doc.addPage(); y = 50; }
        const bg = idx % 2 === 0 ? "#F8FAFC" : "#fff";
        doc.rect(50, y - 3, 505, 18).fill(bg);
        const loan = (p as any).loan;
        const borrower = loan?.borrower;
        doc.fillColor("#333").fontSize(8)
          .text(loan?.loanNumber ?? "-", col.loan, y)
          .text(borrower?.name ?? "-", col.borrower, y)
          .text(`₹${Number(p.principalAmount).toLocaleString("en-IN")}`, col.principal, y)
          .text(`₹${Number(p.interestAmount).toLocaleString("en-IN")}`, col.interest, y)
          .text(`₹${Number(p.totalPaid).toLocaleString("en-IN")}`, col.total, y)
          .text(p.paymentMethod, col.method, y)
          .text(new Date(p.paymentDate).toLocaleDateString("en-IN"), col.date, y);
        y += 18;
      }

      doc.end();
    });
  }

  async generateExpenseReportPDF(expenses: InstanceType<typeof Expense>[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const chunks: Buffer[] = [];
      doc.on("data", (c: Buffer) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      this.pdfHeader(doc, "Expense Report");

      const tableTop = doc.y;
      const col = { title: 50, category: 200, amount: 310, date: 390, desc: 460 };

      doc.fontSize(9).fillColor("#fff").rect(50, tableTop, 505, 20).fill("#5EBEA5");
      doc.fillColor("#fff")
        .text("Title", col.title, tableTop + 5)
        .text("Category", col.category, tableTop + 5)
        .text("Amount", col.amount, tableTop + 5)
        .text("Date", col.date, tableTop + 5)
        .text("Description", col.desc, tableTop + 5);

      const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
      let y = tableTop + 25;

      for (const [idx, e] of expenses.entries()) {
        if (y > 700) { doc.addPage(); y = 50; }
        const bg = idx % 2 === 0 ? "#F8FAFC" : "#fff";
        doc.rect(50, y - 3, 505, 18).fill(bg);
        doc.fillColor("#333").fontSize(8)
          .text(e.title, col.title, y, { width: 140 })
          .text(e.category, col.category, y)
          .text(`₹${Number(e.amount).toLocaleString("en-IN")}`, col.amount, y)
          .text(new Date(e.expenseDate).toLocaleDateString("en-IN"), col.date, y)
          .text(e.description ?? "-", col.desc, y, { width: 95 });
        y += 18;
      }

      // Total
      doc.moveDown().fontSize(11).fillColor("#2C3E50")
        .text(`Total Expenses: ₹${totalExpense.toLocaleString("en-IN")}`, { align: "right" });

      doc.end();
    });
  }

  // ─────────────────────────────────────────────
  // Excel generators
  // ─────────────────────────────────────────────

  async generateLoanReportExcel(loans: InstanceType<typeof Loan>[]): Promise<Buffer> {
    const data = loans.map((loan) => {
      const borrower = (loan as any).borrower;
      const payment = (loan as any).payments?.[0];
      return {
        "Loan Number": loan.loanNumber,
        "Borrower Name": borrower?.name ?? "-",
        Mobile: borrower?.mobile ?? "-",
        "Principal Amount": Number(loan.principalAmount),
        "Interest Rate (%)": Number(loan.interestRate),
        "Duration (Months)": loan.durationMonths,
        "Total Interest": Number(loan.totalInterest),
        "Total Payable": Number(loan.totalPayable),
        Status: loan.status,
        "Loan Date": new Date(loan.loanDate).toLocaleDateString("en-IN"),
        "Due Date": new Date(loan.dueDate).toLocaleDateString("en-IN"),
        "Closed Date": loan.closedDate ? new Date(loan.closedDate).toLocaleDateString("en-IN") : "-",
        "Payment Method": payment?.paymentMethod ?? "-",
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Loans");
    ws["!cols"] = Object.keys(data[0] ?? {}).map(() => ({ wch: 22 }));
    return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
  }

  async generatePaymentReportExcel(payments: InstanceType<typeof LoanPayment>[]): Promise<Buffer> {
    const data = payments.map((p) => {
      const loan = (p as any).loan;
      const borrower = loan?.borrower;
      return {
        "Loan Number": loan?.loanNumber ?? "-",
        Borrower: borrower?.name ?? "-",
        Mobile: borrower?.mobile ?? "-",
        "Principal Paid": Number(p.principalAmount),
        "Interest Paid": Number(p.interestAmount),
        "Total Paid": Number(p.totalPaid),
        "Payment Method": p.paymentMethod,
        "Payment Date": new Date(p.paymentDate).toLocaleDateString("en-IN"),
        "Collected By": p.collectedBy ?? "-",
        Remarks: p.remarks ?? "",
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payments");
    ws["!cols"] = Object.keys(data[0] ?? {}).map(() => ({ wch: 22 }));
    return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
  }

  async generateExpenseReportExcel(expenses: InstanceType<typeof Expense>[]): Promise<Buffer> {
    const data = expenses.map((e) => ({
      Title: e.title,
      Category: e.category,
      Amount: Number(e.amount),
      "Expense Date": new Date(e.expenseDate).toLocaleDateString("en-IN"),
      Description: e.description ?? "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");
    ws["!cols"] = Object.keys(data[0] ?? {}).map(() => ({ wch: 22 }));
    return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
  }
}

export const reportService = new ReportService();
