import { Router } from "express";
import { notificationController } from "../controllers/notification.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireAdmin, requireAny } from "../middleware/role.middleware";

const router = Router();
router.use(authenticate, requireAny);

router.get("/", (req, res, next) =>
  notificationController.getAll(req as never, res, next),
);
router.get("/unread-count", (req, res, next) =>
  notificationController.getUnreadCount(req as never, res, next),
);
router.get("/stats", requireAdmin, (req, res, next) =>
  notificationController.getStats(req as never, res, next),
);
router.post("/broadcast", requireAdmin, (req, res, next) =>
  notificationController.broadcast(req as never, res, next),
);
router.patch("/mark-all-read", (req, res, next) =>
  notificationController.markAllRead(req as never, res, next),
);
router.patch("/:id/read", (req, res, next) =>
  notificationController.markRead(req as never, res, next),
);
router.patch("/:id/opened", (req, res, next) =>
  notificationController.markOpened(req as never, res, next),
);
router.delete("/:id", (req, res, next) =>
  notificationController.deleteNotification(req as never, res, next),
);

export default router;
