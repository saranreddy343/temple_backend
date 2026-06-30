import { env } from "./config/env";
import { connectDatabase } from "./config/database";
import { initializeFirebase } from "./config/firebase";
import app from "./app";
import { logger } from "./utils/logger";
import cron from "node-cron";
import { loanService } from "./services/loan.service";
import { notificationService } from "./services/notification.service";

const startServer = async (): Promise<void> => {
  await connectDatabase();
  initializeFirebase();

  // Cron: Update loan statuses (ACTIVE → DUE_SOON → OVERDUE) daily at midnight
  cron.schedule("0 0 * * *", async () => {
    logger.info("Running loan status update...");
    await loanService.updateLoanStatuses();
    logger.info("Loan statuses updated");
  });

  // Cron: Send loan repayment reminders daily at 9 AM
  cron.schedule("0 9 * * *", async () => {
    logger.info("Sending loan repayment reminders...");
    await notificationService.sendLoanReminders();
  });

  const server = app.listen(env.PORT, () => {
    logger.info(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    logger.info(
      `API available at http://localhost:${env.PORT}${env.API_PREFIX}`,
    );
  });

  const gracefulShutdown = (signal: string) => {
    logger.info(`${signal} received. Starting graceful shutdown...`);
    server.close(() => {
      logger.info("Server closed.");
      process.exit(0);
    });
    setTimeout(() => {
      logger.error("Forced shutdown after timeout.");
      process.exit(1);
    }, 30000);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled Rejection:", reason);
  });
};

startServer().catch((error) => {
  logger.error("Failed to start server:", error);
  process.exit(1);
});
