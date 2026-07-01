import { OtpProvider, OtpSendResult } from "./OtpProvider";
import { logger } from "../../utils/logger";

/**
 * Development OTP provider.
 * Does NOT send an SMS. Returns the OTP directly in the result so the
 * API can include it in the response body for easy testing.
 *
 * Switch to TwilioOtpProvider (or FirebaseOtpProvider) for production.
 */
export class DevelopmentOtpProvider implements OtpProvider {
  async send(mobile: string, otp: string): Promise<OtpSendResult> {
    logger.info(`[DEV OTP] Mobile: ${mobile} | OTP: ${otp}`);
    return { sent: true, devOtp: otp };
  }
}
