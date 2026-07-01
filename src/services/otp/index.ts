import { OtpProvider } from "./OtpProvider";
import { DevelopmentOtpProvider } from "./DevelopmentOtpProvider";
import { TwilioOtpProvider } from "./TwilioOtpProvider";

export { otpStorage } from "./OtpStorage";
export type { OtpProvider, OtpSendResult } from "./OtpProvider";

/**
 * Returns the appropriate OTP provider based on environment.
 *
 * Development mode  →  DevelopmentOtpProvider  (returns OTP in response, no SMS)
 * Production mode   →  TwilioOtpProvider        (sends SMS, OTP never returned)
 *
 * To force dev mode without changing NODE_ENV, set USE_DEV_OTP=true in .env.
 */
function createOtpProvider(): OtpProvider {
  const useDevOtp =
    process.env.NODE_ENV === "development" ||
    process.env.USE_DEV_OTP === "true";

  return useDevOtp ? new DevelopmentOtpProvider() : new TwilioOtpProvider();
}

export const otpProvider = createOtpProvider();
