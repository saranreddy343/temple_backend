export interface OtpSendResult {
  /** Whether the OTP was dispatched (always true on success) */
  sent: boolean;
  /**
   * Only populated in development mode.
   * NEVER present in production responses.
   */
  devOtp?: string;
}

export interface OtpProvider {
  send(mobile: string, otp: string): Promise<OtpSendResult>;
}
