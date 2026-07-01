import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { authService } from "../services/auth.service";
import { sendSuccess, sendError, sendCreated } from "../utils/response";

export class AuthController {
  async adminLogin(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { mobile, password } = req.body as {
        mobile: string;
        password: string;
      };
      const result = await authService.adminLogin(mobile, password);
      console.log("Admin login successful for mobile:", result);
      sendSuccess(
        res,
        {
          user: result.user.toSafeJSON(),
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
        "Login successful",
      );
    } catch (error) {
      if (error instanceof Error && error.message === "Invalid credentials") {
        sendError(res, "Invalid credentials", 401);
      } else {
        next(error);
      }
    }
  }

  async sendOTP(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { mobile } = req.body as { mobile: string };
      const result = await authService.sendOTP(mobile);
      // devOtp is only populated when USE_DEV_OTP=true / NODE_ENV=development
      sendSuccess(
        res,
        {
          expiresIn: result.expiresIn,
          ...(result.devOtp !== undefined ? { devOtp: result.devOtp } : {}),
        },
        "OTP generated successfully",
      );
    } catch (error) {
      if (error instanceof Error) {
        sendError(res, error.message, 400);
      } else {
        next(error);
      }
    }
  }

  async verifyOTP(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { mobile, otp } = req.body as { mobile: string; otp: string };
      const result = await authService.verifyOTP(mobile, otp);
      sendSuccess(
        res,
        {
          user: result.user.toSafeJSON(),
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
        "OTP verified successfully",
      );
    } catch (error) {
      if (error instanceof Error) {
        sendError(res, error.message, 400);
      } else {
        next(error);
      }
    }
  }

  async refreshToken(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { refreshToken } = req.body as { refreshToken: string };
      const payload = authService.verifyRefreshToken(refreshToken);
      const tokens = authService.generateTokens(payload);
      sendSuccess(res, tokens, "Token refreshed");
    } catch (error) {
      sendError(res, "Invalid or expired refresh token", 401);
      void next;
      void error;
    }
  }

  async getMe(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { User } = await import("../models");
      const user = await User.findByPk(req.user!.id);
      if (!user) {
        sendError(res, "User not found", 404);
        return;
      }
      sendSuccess(res, user.toSafeJSON(), "Profile fetched");
    } catch (error) {
      next(error);
    }
  }

  async updateMe(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { name, address } = req.body as { name: string; address?: string };
      const user = await authService.updateProfile(req.user!.id, {
        name,
        address,
      });
      sendSuccess(res, user.toSafeJSON(), "Profile updated successfully");
    } catch (error) {
      if (error instanceof Error && error.message === "User not found") {
        sendError(res, error.message, 404);
      } else {
        next(error);
      }
    }
  }

  async changePassword(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body as {
        currentPassword: string;
        newPassword: string;
      };

      await authService.changePassword(
        req.user!.id,
        currentPassword,
        newPassword,
      );

      sendSuccess(res, null, "Password updated successfully");
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message === "User not found" ||
          error.message === "Current password is incorrect")
      ) {
        sendError(
          res,
          error.message,
          error.message === "User not found" ? 404 : 400,
        );
      } else {
        next(error);
      }
    }
  }

  async updateFCMToken(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { User } = await import("../models");
      const { fcmToken } = req.body as { fcmToken: string };
      await User.update({ fcmToken }, { where: { id: req.user!.id } });
      sendSuccess(res, null, "FCM token updated");
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
