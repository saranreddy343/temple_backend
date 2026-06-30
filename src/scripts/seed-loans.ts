import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { sequelize } from "../config/database";
import { User, Loan, TempleFund } from "../models";
import { LoanStatus, UserRole } from "../types";
import { calculateLoan } from "../utils/helpers";

const seedLoans = async () => {
  await sequelize.authenticate();
  console.log("Connected to database.");

  // Get borrowers
  const borrowers = await User.findAll({
    where: { role: UserRole.BORROWER, isActive: true },
  });
  if (!borrowers.length) {
    console.log("No borrowers found. Run seed-users first.");
    process.exit(1);
  }

  const admin = await User.findOne({ where: { role: UserRole.ADMIN } });
  if (!admin) {
    console.log("No admin found. Run seed-users first.");
    process.exit(1);
  }

  // Ensure TempleFund exists
  const [fund] = await TempleFund.findOrCreate({
    where: {},
    defaults: {
      totalAmount: 500000,
      availableAmount: 320000,
      loanedAmount: 180000,
    } as never,
  });
  console.log("Temple fund ready:", fund.get("totalAmount"));

  const loansData = [
    {
      borrower: borrowers[0],
      loanNumber: "LN-2026-001",
      principalAmount: 50000,
      interestRate: 2,
      loanDate: new Date("2026-01-15"),
      durationMonths: 12,
      status: LoanStatus.ACTIVE,
      remarks: "Medical expenses",
    },
    {
      borrower: borrowers[1] ?? borrowers[0],
      loanNumber: "LN-2026-002",
      principalAmount: 80000,
      interestRate: 2,
      loanDate: new Date("2026-02-01"),
      durationMonths: 24,
      status: LoanStatus.ACTIVE,
      remarks: "Business expansion",
    },
    {
      borrower: borrowers[2] ?? borrowers[0],
      loanNumber: "LN-2025-015",
      principalAmount: 30000,
      interestRate: 2,
      loanDate: new Date("2025-06-10"),
      durationMonths: 12,
      status: LoanStatus.COMPLETED,
      closedDate: new Date("2026-05-10"),
      remarks: "Education fees",
    },
  ];

  for (const data of loansData) {
    const calc = calculateLoan(
      data.principalAmount,
      data.interestRate,
      data.durationMonths,
      data.loanDate,
    );

    const [loan, created] = await Loan.findOrCreate({
      where: { loanNumber: data.loanNumber },
      defaults: {
        borrowerId: data.borrower.id,
        loanNumber: data.loanNumber,
        principalAmount: data.principalAmount,
        interestRate: data.interestRate,
        loanDate: data.loanDate,
        durationMonths: data.durationMonths,
        status: data.status,
        monthlyInterest: calc.monthlyInterest,
        totalInterest: calc.totalInterest,
        totalPayable: calc.totalPayable,
        remainingBalance:
          data.status === LoanStatus.COMPLETED ? 0 : calc.totalPayable,
        dueDate: calc.dueDate,
        createdBy: admin.id,
        closedDate: (data as any).closedDate,
        remarks: data.remarks,
      },
    });

    console.log(
      `${created ? "Created" : "Already exists"}: ${loan.loanNumber} — ₹${loan.principalAmount} (${loan.status})`,
    );
  }

  console.log("\n--- Test Data Summary ---");
  console.log(
    "Loans created: LN-2026-001, LN-2026-002 (ACTIVE), LN-2025-015 (COMPLETED)",
  );
  console.log(
    "Temple Fund: ₹5,00,000 total | ₹3,20,000 available | ₹1,80,000 loaned",
  );

  await sequelize.close();
};

seedLoans().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
