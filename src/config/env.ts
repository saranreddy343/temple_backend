import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  API_PREFIX: string;
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  OTP_EXPIRY_MINUTES: number;
  OTP_LENGTH: number;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_PRIVATE_KEY: string;
  FIREBASE_CLIENT_EMAIL: string;
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  TWILIO_PHONE_NUMBER: string;
  USE_DEV_OTP: boolean;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  ALLOWED_ORIGINS: string[];
  LOG_LEVEL: string;
}

const getEnvVar = (key: string, required = true): string => {
  const value = process.env[key];
  if (required && (value === undefined || value === "")) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value ?? "";
};

export const env: EnvConfig = {
  NODE_ENV: getEnvVar("NODE_ENV", false) || "development",
  PORT: parseInt(getEnvVar("PORT", false) || "5000", 10),
  API_PREFIX: getEnvVar("API_PREFIX", false) || "/api/v1",
  DB_HOST: getEnvVar("DB_HOST"),
  DB_PORT: parseInt(getEnvVar("DB_PORT", false) || "5432", 10),
  DB_NAME: getEnvVar("DB_NAME"),
  DB_USER: getEnvVar("DB_USER"),
  DB_PASSWORD: getEnvVar("DB_PASSWORD"),
  JWT_SECRET: getEnvVar("JWT_SECRET"),
  JWT_REFRESH_SECRET: getEnvVar("JWT_REFRESH_SECRET"),
  JWT_EXPIRES_IN: getEnvVar("JWT_EXPIRES_IN", false) || "15m",
  JWT_REFRESH_EXPIRES_IN: getEnvVar("JWT_REFRESH_EXPIRES_IN", false) || "7d",
  OTP_EXPIRY_MINUTES: parseInt(
    getEnvVar("OTP_EXPIRY_MINUTES", false) || "10",
    10,
  ),
  OTP_LENGTH: parseInt(getEnvVar("OTP_LENGTH", false) || "6", 10),
  FIREBASE_PROJECT_ID: getEnvVar("FIREBASE_PROJECT_ID", false),
  FIREBASE_PRIVATE_KEY: getEnvVar("FIREBASE_PRIVATE_KEY", false),
  FIREBASE_CLIENT_EMAIL: getEnvVar("FIREBASE_CLIENT_EMAIL", false),
  TWILIO_ACCOUNT_SID: getEnvVar("TWILIO_ACCOUNT_SID", false),
  TWILIO_AUTH_TOKEN: getEnvVar("TWILIO_AUTH_TOKEN", false),
  TWILIO_PHONE_NUMBER: getEnvVar("TWILIO_PHONE_NUMBER", false),
  USE_DEV_OTP:
    getEnvVar("USE_DEV_OTP", false) === "true" ||
    (getEnvVar("NODE_ENV", false) || "development") === "development",
  RATE_LIMIT_WINDOW_MS: parseInt(
    getEnvVar("RATE_LIMIT_WINDOW_MS", false) || "900000",
    10,
  ),
  RATE_LIMIT_MAX_REQUESTS: parseInt(
    getEnvVar("RATE_LIMIT_MAX_REQUESTS", false) || "100",
    10,
  ),
  ALLOWED_ORIGINS: (
    getEnvVar("ALLOWED_ORIGINS", false) || "http://localhost:3000"
  ).split(","),
  LOG_LEVEL: getEnvVar("LOG_LEVEL", false) || "debug",
};
