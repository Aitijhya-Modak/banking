import { Router } from "express";
import { validate } from "../../../middleware/validateRequest.middleware.js";
import { staffLoginSchema } from "../../../schemas/staff/schema.js";
import {
  meService,
  refreshStaffTokenService,
  staffLoginService,
  staffLogoutService,
} from "../../../service/staff/staffAuth.service.js";
import { env } from "../../../config/config.js";
import { NODE_PROD } from "../../../config/constants.js";
import { AppError } from "../../../error/AppError.js";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../../../middleware/validateAuth.middleware.js";

export const staffAuthRouter = Router();
const isProduction = env.NODE_ENV === NODE_PROD;

/**
 * Authenticates a staff member and creates a secure session.
 * Validates the login payload, verifies the staff credentials, issues signed access and refresh tokens,
 * stores the refresh token in secure HTTP-only cookies, and returns the authenticated staff summary.
 * @route POST /api/staff/auth/login
 * @access Public
 */
staffAuthRouter.post(
  "/login",
  validate(staffLoginSchema),
  async (req, res, next) => {
    try {
      const userAgent = req.headers["user-agent"];
      const ipAddress = req.ip || req.socket.remoteAddress;

      const { staff, accessToken, refreshToken } = await staffLoginService(
        req.body,
        {
          userAgent,
          ipAddress,
        },
      );

      res.cookie("staffAccessToken", accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "none",
        maxAge: 15 * 60 * 1000,
        path: "/",
      });

      res.cookie("staffRefreshToken", refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "none",
        maxAge: 8 * 60 * 60 * 1000,
        path: "/api/staff/auth",
      });

      return res.status(200).json({
        status: "success",
        message: "Staff login successful",
        data: staff,
      });
    } catch (error) {
      return next(error);
    }
  },
);

/**
 * Refreshes an active staff session using the refresh token stored in cookies.
 * Reads the refresh token from the HTTP-only cookie, validates and rotates the session,
 * issues a fresh access token and replacement refresh token, and updates the session cookies.
 * @route POST /api/staff/auth/refresh
 * @access Public (session cookie-based)
 */
staffAuthRouter.post("/refresh", async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies.staffRefreshToken;

    if (!rawRefreshToken) {
      throw new AppError(401, "Staff refresh token not found in cookies");
    }

    const userAgent = req.headers["user-agent"];
    const ipAddress = req.ip || req.socket.remoteAddress;

    const { accessToken, refreshToken } = await refreshStaffTokenService(
      rawRefreshToken,
      {
        userAgent,
        ipAddress,
      },
    );

    res.cookie("staffAccessToken", accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
      path: "/",
    });

    res.cookie("staffRefreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      maxAge: 8 * 60 * 60 * 1000,
      path: "/api/staff/auth",
    });

    return res.status(200).json({
      status: "success",
      message: "Staff session renewed successfully",
    });
  } catch (error) {
    res.clearCookie("staffAccessToken", { path: "/" });
    res.clearCookie("staffRefreshToken", {
      path: "/api/staff/auth",
    });
    return next(error);
  }
});

/**
 * Returns the authenticated staff member profile for the current session.
 * Uses the validated authentication middleware to resolve the logged-in staff identity
 * and fetches the current profile details from the database.
 * @route GET /api/staff/auth/me
 * @access Private (requires authentication)
 */
staffAuthRouter.get(
  "/me",
  requireAuth,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const staffId = req.staff!.staffId;
      const user = await meService(staffId);

      res.status(200).json({
        success: true,
        message: "Credentials are valid",
        data: user,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * Destroys the active staff session.
 * Clears the access and refresh token cookies and revokes the server-side session.
 * @route POST /api/staff/auth/logout
 * @access Private (requires authentication)
 */
staffAuthRouter.post(
  "/logout",
  requireAuth,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      await staffLogoutService(
        req.staff!.staffId,
        req.cookies.staffRefreshToken,
      );

      res.clearCookie("staffAccessToken", {
        httpOnly: true,
        secure: isProduction,
        sameSite: "none",
        path: "/",
      });

      res.clearCookie("staffRefreshToken", {
        httpOnly: true,
        secure: isProduction,
        sameSite: "none",
        path: "/api/staff/auth",
      });

      return res.status(200).json({
        status: "success",
        message: "Staff logout successful",
      });
    } catch (error) {
      return next(error);
    }
  },
);
