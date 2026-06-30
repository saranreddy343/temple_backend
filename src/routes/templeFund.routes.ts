import { Router } from "express";
import { templeFundController } from "../controllers/templeFund.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/role.middleware";

const router = Router();
router.use(authenticate, requireAdmin);

router.get("/", (req, res, next) =>
  templeFundController.get(req as never, res, next),
);
router.post("/add", (req, res, next) =>
  templeFundController.addFunds(req as never, res, next),
);
router.post("/withdraw", (req, res, next) =>
  templeFundController.withdrawFunds(req as never, res, next),
);

export default router;
