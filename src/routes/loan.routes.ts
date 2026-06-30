import { Router } from "express";
import { loanController } from "../controllers/loan.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireAdmin, requireAny } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import { createLoanSchema, loanQuerySchema, updateLoanSchema } from "../validators/loan.validator";

const router = Router();
router.use(authenticate);

router.get("/", requireAny, validate(loanQuerySchema, "query"), (req, res, next) =>
  loanController.getAll(req as never, res, next),
);
router.get("/:id", requireAny, (req, res, next) =>
  loanController.getById(req as never, res, next),
);
router.get("/:id/payments", requireAny, (req, res, next) =>
  loanController.getPayments(req as never, res, next),
);
router.post("/", requireAdmin, validate(createLoanSchema), (req, res, next) =>
  loanController.create(req as never, res, next),
);
router.put("/:id", requireAdmin, validate(updateLoanSchema), (req, res, next) =>
  loanController.update(req as never, res, next),
);
router.post("/:id/close", requireAdmin, (req, res, next) =>
  loanController.closeLoan(req as never, res, next),
);
router.post("/:id/cancel", requireAdmin, (req, res, next) =>
  loanController.cancelLoan(req as never, res, next),
);

export default router;
