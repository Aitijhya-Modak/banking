import type { Request, Response, NextFunction } from "express";
import { verifyJWTAccessToken, type JWTPayload } from "../utils/jwt.js";
import { AppError } from "../error/AppError.js";

export interface AuthenticatedRequest extends Request {
  staff?: JWTPayload;
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const token = req.cookies.staffAccessToken;
  console.log(req.cookies);

  if (!token) {
    throw new AppError(401, "Authentication required");
  }

  try {
    const decoded = verifyJWTAccessToken(token);
    req.staff = decoded;
    return next();
  } catch {
    throw new AppError(401, "Invalid or expired access token");
  }
}
