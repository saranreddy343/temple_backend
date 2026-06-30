import { Router } from "express";
import { expenseController } from "../controllers/expense.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/role.middleware";

const router = Router();

router.use(authenticate);

// All authenticated users can view expenses
router.get("/", expenseController.getAll.bind(expenseController));
router.get("/summary", expenseController.getSummary.bind(expenseController));
router.get("/:id", expenseController.getById.bind(expenseController));

// Only admins can create/update expenses
router.post(
  "/",
  requireAdmin,
  expenseController.create.bind(expenseController),
);
router.put(
  "/:id",
  requireAdmin,
  expenseController.update.bind(expenseController),
);

export default router;
