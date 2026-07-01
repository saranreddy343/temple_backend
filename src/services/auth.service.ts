import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "../models";
import { UserRole, JwtPayload } from "../types";
import { env } from "../config/env";
import { generateOTP } from "../utils/helpers";
import { logger } from "../utils/logger";
import { auditService } from "./audit.service";
import { otpStorage, otpProvider } from "./otp";

export const getOtpStore = () => otpStorage; // kept for backward compat with controller

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

  async sendOTP(
    mobile: string,
  ): Promise<{ expiresIn: number; devOtp?: string }> {
    const user = await User.findOne({
      where: { mobile, role: UserRole.BORROWER, isActive: true },
    });
    if (!user) throw new Error("Mobile number not registered");

    // Prevent OTP spam — enforce resend cooldown
    if (!otpStorage.canResend(mobile)) {
      const wait = otpStorage.secondsUntilResend(mobile);
      throw new Error(
        `Please wait ${wait} second${wait !== 1 ? "s" : ""} before requesting a new OTP.`,
      );
    }

    const otp = generateOTP(env.OTP_LENGTH);
    otpStorage.set(mobile, otp, env.OTP_EXPIRY_MINUTES * 60 * 1000);

    const result = await otpProvider.send(mobile, otp);

    return {
      expiresIn: env.OTP_EXPIRY_MINUTES * 60,
      devOtp: result.devOtp,
    };
  }

  async verifyOTP(
    mobile: string,
    otp: string,
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const stored = otpStorage.get(mobile);
    if (!stored)
      throw new Error("OTP not found or expired. Please request a new OTP.");

    if (otpStorage.isExpired(stored)) {
      otpStorage.delete(mobile);
      throw new Error("OTP has expired. Please request a new one.");
    }

    const attempts = otpStorage.incrementAttempts(mobile);
    if (attempts > stored.maxAttempts) {
      otpStorage.delete(mobile);
      throw new Error("Too many failed attempts. Please request a new OTP.");
    }

    if (stored.otp !== otp) throw new Error("Invalid OTP");

    otpStorage.delete(mobile);

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

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }
}

export const authService = new AuthService();
