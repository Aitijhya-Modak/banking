import type { Role } from "@prisma/client";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/config.js";

export type JWTPayload = {
  staffId: string;
  role: string;
  email: string;
};

export function signJWTAccessToken(payload: JWTPayload): string {
  const accessToken = jwt.sign(payload, env.JWT_SECRET_KEY, {
    expiresIn: env.JWT_EXPIRES_AT as SignOptions,
  } as SignOptions);

  return accessToken;
}

/**
 * Verifies an Access Token and returns the decoded payload.
 * Throws an error if the token is invalid or expired.
 */
export const verifyJWTAccessToken = (token: string): JWTPayload => {
  return jwt.verify(token, env.JWT_SECRET_KEY) as JWTPayload;
};
