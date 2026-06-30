import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createUserSchema,
  updateUserSchema,
  userQuerySchema,
} from "../validators/user.validator";

const router = Router();
router.use(authenticate, requireAdmin);

router.get("/", validate(userQuerySchema, "query"), (req, res, next) =>
  userController.getAll(req as never, res, next),
);
router.get("/:id", (req, res, next) =>
  userController.getById(req as never, res, next),
);
router.post("/", validate(createUserSchema), (req, res, next) =>
  userController.create(req as never, res, next),
);
router.put("/:id", validate(updateUserSchema), (req, res, next) =>
  userController.update(req as never, res, next),
);
router.delete("/:id", (req, res, next) =>
  userController.deactivate(req as never, res, next),
);

export default router;
