import { Sequelize } from "sequelize";
import { env } from "./env";
import { logger } from "../utils/logger";

export const sequelize = new Sequelize({
  dialect: "postgres",
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  logging: env.NODE_ENV === "development" ? (msg) => logger.debug(msg) : false,
  pool: {
    max: 20,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false },
  },
});

export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info("Database connection established successfully.");

    if (env.NODE_ENV === "development") {
      // Drop redesigned tables that have incompatible old schemas before sync.
      // Notifications was completely redesigned (old schema had userId/isRead columns).
      // user_notifications is a new table that references the new notifications.
      // Drop in dependency order (child first).
      await sequelize.query(
        `DROP TABLE IF EXISTS "user_notifications" CASCADE`,
      );
      // Only drop notifications if it has the old schema (check for old column)
      const [oldNotifRows] = await sequelize.query(
        `SELECT column_name FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'notifications'
         AND column_name IN ('userId', 'isRead', 'data')
         LIMIT 1`,
      );
      if ((oldNotifRows as unknown[]).length > 0) {
        logger.info(
          "Detected old notifications schema — dropping for recreation.",
        );
        await sequelize.query(`DROP TABLE IF EXISTS "notifications" CASCADE`);
      }
    }

    await sequelize.sync({ alter: env.NODE_ENV === "development" });
    logger.info("Database models synchronized.");
  } catch (error) {
    logger.error("Unable to connect to database:", error);
    process.exit(1);
  }
};
