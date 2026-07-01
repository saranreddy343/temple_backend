import { OtpProvider, OtpSendResult } from "./OtpProvider";

/**
 * Twilio SMS OTP provider — stub for future integration.
 *
 * To activate:
 * 1. npm install twilio
 * 2. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER in .env
 * 3. Uncomment the Twilio client code below
 * 4. Set USE_DEV_OTP=false (or NODE_ENV=production)
 */
export class TwilioOtpProvider implements OtpProvider {
  async send(mobile: string, otp: string): Promise<OtpSendResult> {
    // --- Uncomment when ready for Twilio ---
    // const client = require('twilio')(
    //   process.env.TWILIO_ACCOUNT_SID,
    //   process.env.TWILIO_AUTH_TOKEN,
    // );
    // await client.messages.create({
    //   body: `Your Temple Finance OTP is ${otp}. Valid for ${env.OTP_EXPIRY_MINUTES} minutes.`,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: `+91${mobile}`,
    // });
    // return { sent: true };
    // ---------------------------------------

    throw new Error(
      `TwilioOtpProvider: not yet configured. Set USE_DEV_OTP=true to use development mode. (mobile=${mobile}, otp=${otp})`,
    );
  }
}
