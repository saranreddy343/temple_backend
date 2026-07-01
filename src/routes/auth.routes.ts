import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { validate } from "../middleware/validate.middleware";
import { authenticate } from "../middleware/auth.middleware";
import {
  adminLoginSchema,
  sendOTPSchema,
  verifyOTPSchema,
  refreshTokenSchema,
  updateProfileSchema,
  changePasswordSchema,
} from "../validators/auth.validator";

const router = Router();

router.post("/admin/login", validate(adminLoginSchema), (req, res, next) =>
  authController.adminLogin(req, res, next),
);
router.post("/otp/send", validate(sendOTPSchema), (req, res, next) =>
  authController.sendOTP(req, res, next),
);
router.post("/otp/verify", validate(verifyOTPSchema), (req, res, next) =>
  authController.verifyOTP(req, res, next),
);
router.post("/token/refresh", validate(refreshTokenSchema), (req, res, next) =>
  authController.refreshToken(req, res, next),
);
router.get("/me", authenticate, (req, res, next) =>
  authController.getMe(req as never, res, next),
);
router.patch(
  "/me",
  authenticate,
  validate(updateProfileSchema),
  (req, res, next) => authController.updateMe(req as never, res, next),
);
router.patch(
  "/password",
  authenticate,
  validate(changePasswordSchema),
  (req, res, next) => authController.changePassword(req as never, res, next),
);
router.patch("/fcm-token", authenticate, (req, res, next) =>
  authController.updateFCMToken(req as never, res, next),
);

export default router;
