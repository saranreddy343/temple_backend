import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import loanRoutes from "./loan.routes";
import dashboardRoutes from "./dashboard.routes";
import templeFundRoutes from "./templeFund.routes";
import notificationRoutes from "./notification.routes";
import reportRoutes from "./report.routes";
import expenseRoutes from "./expense.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/loans", loanRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/temple-fund", templeFundRoutes);
router.use("/notifications", notificationRoutes);
router.use("/reports", reportRoutes);
router.use("/expenses", expenseRoutes);

router.get("/health", (_, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "2.0.0",
  });
});

export default router;
