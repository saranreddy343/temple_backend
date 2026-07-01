import admin from "firebase-admin";
import path from "path";
import fs from "fs";
import { logger } from "../utils/logger";

let firebaseApp: admin.app.App | null = null;

const SERVICE_ACCOUNT_PATH = path.resolve(
  __dirname,
  "temple-df356-firebase-adminsdk-fbsvc-2c6d868da0.json",
);

export const initializeFirebase = (): void => {
  try {
    let credential: admin.credential.Credential;

    if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
      // Load directly from service account JSON file (most reliable — no env-var escaping issues)
      const serviceAccount = JSON.parse(
        fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf-8"),
      );
      credential = admin.credential.cert(serviceAccount);
      logger.info("Firebase: loading credentials from service account file.");
    } else {
      // Fallback to individual env vars
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

      if (!projectId || !privateKey || !clientEmail) {
        logger.warn(
          "Firebase credentials not configured. Push notifications will be disabled.",
        );
        return;
      }
      credential = admin.credential.cert({
        projectId,
        privateKey: privateKey.replace(/\\n/g, "\n"),
        clientEmail,
      });
    }

    firebaseApp = admin.initializeApp({ credential });
    logger.info("Firebase Admin SDK initialized successfully.");
  } catch (error) {
    logger.error("Failed to initialize Firebase:", error);
  }
};

export const getFirebaseAdmin = (): admin.app.App | null => firebaseApp;

export const getMessaging = (): admin.messaging.Messaging | null => {
  if (!firebaseApp) return null;
  return admin.messaging(firebaseApp);
};
