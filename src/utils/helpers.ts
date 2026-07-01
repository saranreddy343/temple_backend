import crypto from "crypto";
import { LoanCalculation } from "../types";

export const generateLoanNumber = (): string => {
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `TF-${year}-${random}`;
};

export const calculateLoan = (
  principalAmount: number,
  interestRate: number,
  durationMonths: number,
  loanDate: Date,
): LoanCalculation => {
  const monthlyInterest = (principalAmount * interestRate) / 100;
  const totalInterest = monthlyInterest * durationMonths;
  const totalPayable = principalAmount + totalInterest;

  const dueDate = new Date(loanDate);
  dueDate.setMonth(dueDate.getMonth() + durationMonths);

  return { monthlyInterest, totalInterest, totalPayable, dueDate };
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
};

export const sanitizePhoneNumber = (mobile: string): string => {
  return mobile.replace(/\D/g, "").slice(-10);
};

export const getCurrentMonthYear = (): { month: number; year: number } => {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
};

export const generateOTP = (length = 6): string => {
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += crypto.randomInt(0, 10).toString();
  }
  return otp;
};

export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const getDaysUntilDue = (dueDate: Date | string): number => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};
