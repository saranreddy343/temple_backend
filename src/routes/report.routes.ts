import { Router } from "express";
import { reportController } from "../controllers/report.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/role.middleware";

const router = Router();
router.use(authenticate, requireAdmin);

router.get("/loans", (req, res, next) =>
  reportController.getLoanReport(req as never, res, next),
);
router.get("/payments", (req, res, next) =>
  reportController.getPaymentReport(req as never, res, next),
);
router.get("/expenses", (req, res, next) =>
  reportController.getExpenseReport(req as never, res, next),
);
router.get("/overdue", (req, res, next) =>
  reportController.getOverdueReport(req as never, res, next),
);
router.get("/borrower/:borrowerId", (req, res, next) =>
  reportController.getBorrowerReport(req as never, res, next),
);

export default router;
