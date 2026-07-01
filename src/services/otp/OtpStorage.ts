export interface OtpEntry {
  mobile: string;
  otp: string;
  createdAt: Date;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
}

/** Minimum seconds a borrower must wait before requesting a new OTP */
const RESEND_COOLDOWN_SECONDS = 60;

/** How often the in-memory store is swept for expired entries */
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // every 5 minutes

/**
 * In-memory OTP store.
 * Can be replaced with a Redis-backed store for multi-instance deployments.
 */
class OtpStorage {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly store = new Map<string, OtpEntry>();

  constructor() {
    // Periodically evict expired entries so memory never grows unbounded
    const timer = setInterval(() => this.cleanup(), CLEANUP_INTERVAL_MS);
    // Allow the Node.js process to exit even while the timer is pending
    if (typeof timer === "object" && timer.unref) timer.unref();
  }

  set(mobile: string, otp: string, expiryMs: number, maxAttempts = 5): void {
    const now = new Date();
    this.store.set(mobile, {
      mobile,
      otp,
      createdAt: now,
      expiresAt: new Date(now.getTime() + expiryMs),
      attempts: 0,
      maxAttempts,
    });
  }

  get(mobile: string): OtpEntry | undefined {
    return this.store.get(mobile);
  }

  incrementAttempts(mobile: string): number {
    const entry = this.store.get(mobile);
    if (!entry) return 0;
    entry.attempts += 1;
    return entry.attempts;
  }

  delete(mobile: string): void {
    this.store.delete(mobile);
  }

  isExpired(entry: OtpEntry): boolean {
    return new Date() > entry.expiresAt;
  }

  /**
   * Returns true when enough time has passed since the last OTP was sent.
   * Always true when no pending OTP exists for this mobile.
   */
  canResend(mobile: string, cooldownSeconds = RESEND_COOLDOWN_SECONDS): boolean {
    const entry = this.store.get(mobile);
    if (!entry) return true;
    const elapsedSeconds = (Date.now() - entry.createdAt.getTime()) / 1000;
    return elapsedSeconds >= cooldownSeconds;
  }

  /**
   * Seconds remaining before a new OTP can be requested.
   * Returns 0 when a resend is already allowed.
   */
  secondsUntilResend(
    mobile: string,
    cooldownSeconds = RESEND_COOLDOWN_SECONDS,
  ): number {
    const entry = this.store.get(mobile);
    if (!entry) return 0;
    const elapsedSeconds = (Date.now() - entry.createdAt.getTime()) / 1000;
    return Math.max(0, Math.ceil(cooldownSeconds - elapsedSeconds));
  }

  /** Remove all expired entries. Returns the number of entries removed. */
  cleanup(): number {
    const now = new Date();
    let removed = 0;
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        removed++;
      }
    }
    return removed;
  }
}

export const otpStorage = new OtpStorage();
