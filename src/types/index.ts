import { Request } from "express";

export enum UserRole {
  ADMIN = "ADMIN",
  BORROWER = "BORROWER",
}

export enum LoanStatus {
  ACTIVE = "ACTIVE",
  DUE_SOON = "DUE_SOON",
  OVERDUE = "OVERDUE",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum PaymentScheduleStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  OVERDUE = "OVERDUE",
}

export enum PaymentMethod {
  CASH = "CASH",
  UPI = "UPI",
  BANK_TRANSFER = "BANK_TRANSFER",
  CHEQUE = "CHEQUE",
}

export enum ExpenseCategory {
  FESTIVAL = "FESTIVAL",
  MAINTENANCE = "MAINTENANCE",
  DECORATION = "DECORATION",
  ELECTRICITY = "ELECTRICITY",
  WATER = "WATER",
  ANNADANAM = "ANNADANAM",
  SALARY = "SALARY",
  MISCELLANEOUS = "MISCELLANEOUS",
}

export enum NotificationTargetType {
  ALL = "ALL",
  ADMINS_ONLY = "ADMINS_ONLY",
  BORROWERS_ONLY = "BORROWERS_ONLY",
  SPECIFIC_USER = "SPECIFIC_USER",
  ACTIVE_BORROWERS_WITH_LOANS = "ACTIVE_BORROWERS_WITH_LOANS",
  OVERDUE_BORROWERS = "OVERDUE_BORROWERS",
}

export enum NotificationStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  FAILED = "FAILED",
}

export interface JwtPayload {
  id: string;
  mobile: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown[];
}

export interface LoanCalculation {
  monthlyInterest: number;
  totalInterest: number;
  totalPayable: number;
  dueDate: Date;
}

export interface DashboardStats {
  totalTempleFund: number;
  availableFund: number;
  totalLoanedAmount: number;
  distributedAmount: number;
  expectedReturnAmount: number;
  activeLoans: number;
  activeBorrowers: number;
  overdueLoans: number;
  dueSoonLoans: number;
  threeMonthLoans: number;
  sixMonthLoans: number;
  totalExpenses: number;
  currentMonthExpenses: number;
}

export interface OTPData {
  otp: string;
  mobile: string;
  expiresAt: Date;
}
