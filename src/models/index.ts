import { User } from "./User";
import { TempleFund } from "./TempleFund";
import { Loan } from "./Loan";
import { LoanPayment } from "./LoanPayment";
import { Expense } from "./Expense";
import { Notification } from "./Notification";
import { UserNotification } from "./UserNotification";
import { AuditLog } from "./AuditLog";

// User → Loans (borrower)
User.hasMany(Loan, { foreignKey: "borrowerId", as: "loans" });
Loan.belongsTo(User, { foreignKey: "borrowerId", as: "borrower" });

// User → Loans (created by admin)
User.hasMany(Loan, { foreignKey: "createdBy", as: "createdLoans" });
Loan.belongsTo(User, { foreignKey: "createdBy", as: "creator" });

// Loan → LoanPayments
Loan.hasMany(LoanPayment, { foreignKey: "loanId", as: "payments" });
LoanPayment.belongsTo(Loan, { foreignKey: "loanId", as: "loan" });

// User → LoanPayments (collected by admin)
User.hasMany(LoanPayment, {
  foreignKey: "collectedBy",
  as: "collectedPayments",
});
LoanPayment.belongsTo(User, { foreignKey: "collectedBy", as: "collector" });

// User → Expenses (created by admin)
User.hasMany(Expense, { foreignKey: "createdBy", as: "createdExpenses" });
Expense.belongsTo(User, { foreignKey: "createdBy", as: "creator" });

// Notification → UserNotifications
Notification.hasMany(UserNotification, {
  foreignKey: "notificationId",
  as: "userNotifications",
});
UserNotification.belongsTo(Notification, {
  foreignKey: "notificationId",
  as: "notification",
});

// User → UserNotifications
User.hasMany(UserNotification, {
  foreignKey: "userId",
  as: "userNotifications",
});
UserNotification.belongsTo(User, { foreignKey: "userId", as: "user" });

// Notification (created by admin)
User.hasMany(Notification, {
  foreignKey: "createdBy",
  as: "createdNotifications",
});
Notification.belongsTo(User, { foreignKey: "createdBy", as: "creator" });

// User → AuditLogs
User.hasMany(AuditLog, { foreignKey: "userId", as: "auditLogs" });
AuditLog.belongsTo(User, { foreignKey: "userId", as: "user" });

export {
  User,
  TempleFund,
  Loan,
  LoanPayment,
  Expense,
  Notification,
  UserNotification,
  AuditLog,
};
