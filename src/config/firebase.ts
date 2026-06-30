import admin from "firebase-admin";
import { env } from "./env";
import { logger } from "../utils/logger";

let firebaseApp: admin.app.App | null = null;

export const initializeFirebase = (): void => {
  if (
    !env.FIREBASE_PROJECT_ID ||
    !env.FIREBASE_PRIVATE_KEY ||
    !env.FIREBASE_CLIENT_EMAIL
  ) {
    logger.warn(
      "Firebase credentials not configured. Push notifications will be disabled.",
    );
    return;
  }

  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
      }),
    });
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
