import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "../models";
import { UserRole, JwtPayload } from "../types";
import { env } from "../config/env";
import { generateOTP } from "../utils/helpers";
import { logger } from "../utils/logger";
import { auditService } from "./audit.service";

const otpStore = new Map<
  string,
  { otp: string; expiresAt: Date; attempts: number }
>();

export const getOtpStore = () => otpStore;

export class AuthService {
  generateTokens(payload: JwtPayload): {
    accessToken: string;
    refreshToken: string;
  } {
    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });
    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });
    return { accessToken, refreshToken };
  }

  verifyRefreshToken(token: string): JwtPayload {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
  }

  async adminLogin(
    mobile: string,
    password: string,
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const user = await User.findOne({
      where: { mobile, role: UserRole.ADMIN, isActive: true },
    });
    if (!user) throw new Error("Invalid credentials");

    const isValid = await user.comparePassword(password);
    if (!isValid) throw new Error("Invalid credentials");

    const payload: JwtPayload = {
      id: user.id,
      mobile: user.mobile,
      role: user.role,
    };
    const tokens = this.generateTokens(payload);
    return { user, ...tokens };
  }

  async sendOTP(mobile: string): Promise<void> {
    const user = await User.findOne({
      where: { mobile, role: UserRole.BORROWER, isActive: true },
    });
    if (!user) throw new Error("Mobile number not registered");

    const otp = generateOTP(env.OTP_LENGTH);
    const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);

    otpStore.set(mobile, { otp, expiresAt, attempts: 0 });

    // In production, send via Twilio. For dev, log to console.
    if (env.NODE_ENV === "development") {
      logger.info(`[DEV OTP] Mobile: ${mobile} | OTP: ${otp}`);
    } else {
      await this.sendSMSOTP(mobile, otp);
    }
  }

  async verifyOTP(
    mobile: string,
    otp: string,
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const stored = otpStore.get(mobile);
    if (!stored)
      throw new Error("OTP not found or expired. Please request a new OTP.");

    if (new Date() > stored.expiresAt) {
      otpStore.delete(mobile);
      throw new Error("OTP has expired. Please request a new one.");
    }

    stored.attempts += 1;
    if (stored.attempts > 5) {
      otpStore.delete(mobile);
      throw new Error("Too many failed attempts. Please request a new OTP.");
    }

    if (stored.otp !== otp) throw new Error("Invalid OTP");

    otpStore.delete(mobile);

    const user = await User.findOne({
      where: { mobile, role: UserRole.BORROWER, isActive: true },
    });
    if (!user) throw new Error("User not found");

    const payload: JwtPayload = {
      id: user.id,
      mobile: user.mobile,
      role: user.role,
    };
    const tokens = this.generateTokens(payload);
    return { user, ...tokens };
  }

  async updateProfile(
    userId: string,
    data: { name: string; address?: string },
  ): Promise<User> {
    const user = await User.findByPk(userId);
    if (!user) throw new Error("User not found");

    const oldValues = user.toSafeJSON();
    await user.update({
      name: data.name.trim(),
      address: data.address?.trim() || undefined,
    });

    await auditService.log(
      userId,
      "UPDATE_PROFILE",
      "User",
      user.id,
      oldValues as object,
      user.toSafeJSON() as object,
    );

    return user;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user) throw new Error("User not found");

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) throw new Error("Current password is incorrect");

    await user.update({ password: newPassword });

    await auditService.log(userId, "CHANGE_PASSWORD", "User", user.id);
  }

  private async sendSMSOTP(mobile: string, otp: string): Promise<void> {
    try {
      const twilio = await import("twilio");
      const client = twilio.default(
        env.TWILIO_ACCOUNT_SID,
        env.TWILIO_AUTH_TOKEN,
      );
      await client.messages.create({
        body: `Your Temple Finance OTP is: ${otp}. Valid for ${env.OTP_EXPIRY_MINUTES} minutes.`,
        from: env.TWILIO_PHONE_NUMBER,
        to: `+91${mobile}`,
      });
    } catch (error) {
      logger.error("Failed to send OTP SMS:", error);
      throw new Error("Failed to send OTP. Please try again.");
    }
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }
}

export const authService = new AuthService();
