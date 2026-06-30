import { Router } from "express";
import { dashboardController } from "../controllers/dashboard.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireAdmin, requireAny } from "../middleware/role.middleware";

const router = Router();
router.use(authenticate);

router.get("/admin/stats", requireAdmin, (req, res, next) =>
  dashboardController.adminStats(req as never, res, next),
);
router.get("/borrower/stats", requireAny, (req, res, next) =>
  dashboardController.borrowerStats(req as never, res, next),
);
router.get("/loan-distribution", requireAdmin, (req, res, next) =>
  dashboardController.loanDistribution(req as never, res, next),
);
router.get("/expense-trend", requireAdmin, (req, res, next) =>
  dashboardController.expenseTrend(req as never, res, next),
);

export default router;
