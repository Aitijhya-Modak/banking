import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import type { StaffLoginPayload } from "../../schemas/staff/schema.js";
import { prisma } from "../../config/db.js";
import { AppError } from "../../error/AppError.js";
import { signJWTAccessToken } from "../../utils/jwt.js";
import { StaffRole } from "@prisma/client";

/**
 * Authenticates a staff member and creates a new authenticated session.
 * Validates the provided banker email and password, issues a signed access token,
 * generates a random refresh token, stores its hash in the database with client metadata,
 * and returns the staff profile along with both tokens for the client to use.
 * @param payload - The staff login credentials containing the banker email and password.
 * @param meta - Optional metadata for tracking the session, such as the user agent and IP address.
 * @returns An object containing the staff summary, a signed access token, and a raw refresh token.
 * @throws AppError if the email is invalid, the password is wrong, or session creation fails.
 */
export async function staffLoginService(
  payload: StaffLoginPayload,
  meta: { userAgent?: string; ipAddress?: string },
) {
  const { bankerEmail, password } = payload;
  const { userAgent = "Unknown", ipAddress = "0.0.0.0" } = meta;

  const staff = await prisma.staff.findUnique({
    where: { bankerEmail },
    include: { branch: true },
  });

  if (!staff) {
    throw new AppError(401, "Invalid banker email or password");
  }

  // 2. Validate password
  const isPasswordValid = await bcrypt.compare(password, staff.hashedPassword);
  if (!isPasswordValid) {
    throw new AppError(401, "Invalid banker email or password");
  }

  // 3. Generate JWT Access Token
  const jwtPayload = {
    staffId: staff.id,
    email: staff.bankerEmail,
    role: StaffRole.STAFF,
  };
  const accessToken = signJWTAccessToken(jwtPayload);

  // 4. Generate opaque refresh token and hash it
  const rawRefreshToken = crypto.randomBytes(64).toString("hex");
  const refreshTokenHash = crypto
    .createHash("sha256")
    .update(rawRefreshToken)
    .digest("hex");
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);

  // 5. Save session to DB
  await prisma.staffSession.create({
    data: {
      staffId: staff.id,
      refreshTokenHash,
      userAgent,
      ipAddress,
      expiresAt,
    },
  });

  return {
    staff: {
      id: staff.id,
      firstName: staff.firstName,
      lastName: staff.lastName,
      bankerEmail: staff.bankerEmail,
      branch: staff.branch,
    },
    accessToken,
    refreshToken: rawRefreshToken,
  };
}

/**
 * Rotates a staff session by validating the provided refresh token and issuing a new access token.
 * Verifies the incoming refresh token against the stored hash, ensures the session is active
 * and not expired or revoked, invalidates the old session, creates a replacement session,
 * and returns a newly issued access token along with a fresh refresh token.
 * @param rawRefreshToken - The opaque refresh token sent by the client.
 * @param meta - Optional session metadata to associate with the new refresh token.
 * @returns An object containing the new access token and the replacement refresh token.
 * @throws AppError if the refresh token is missing, invalid, revoked, or expired.
 */
export async function refreshStaffTokenService(
  rawRefreshToken: string,
  meta: { userAgent?: string; ipAddress?: string },
) {
  if (!rawRefreshToken) {
    throw new AppError(401, "Refresh token is required");
  }

  const incomingHash = crypto
    .createHash("sha256")
    .update(rawRefreshToken)
    .digest("hex");

  const session = await prisma.staffSession.findUnique({
    where: { refreshTokenHash: incomingHash },
    include: { staff: true },
  });

  if (!session || session.isRevoked) {
    throw new AppError(401, "Invalid or revoked staff session");
  }

  if (new Date() > session.expiresAt) {
    await prisma.staffSession.update({
      where: { id: session.id },
      data: { isRevoked: true },
    });
    throw new AppError(401, "Staff session has expired. Please log in again.");
  }

  await prisma.staffSession.update({
    where: { id: session.id },
    data: { isRevoked: true },
  });

  const accessTokenPaylaod = {
    staffId: session.staff.id,
    email: session.staff.bankerEmail,
    role: StaffRole.STAFF,
  };
  const newAccessToken = signJWTAccessToken(accessTokenPaylaod);

  const newRawRefreshToken = crypto.randomBytes(64).toString("hex");
  const newRefreshTokenHash = crypto
    .createHash("sha256")
    .update(newRawRefreshToken)
    .digest("hex");
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);

  await prisma.staffSession.create({
    data: {
      staffId: session.staff.id,
      refreshTokenHash: newRefreshTokenHash,
      userAgent: meta.userAgent || session.userAgent,
      ipAddress: meta.ipAddress || session.ipAddress,
      expiresAt,
    },
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRawRefreshToken,
  };
}

/**
 * Fetches the authenticated staff member profile by email.
 * Looks up a staff record using the provided banker email, selects the public profile fields,
 * and returns the staff details for the authenticated user context.
 * @param email - The banker email used to identify the staff member.
 * @returns The staff profile details including id, name, email, and role.
 * @throws AppError if no matching staff profile is found.
 */
export async function meService(staffId: string) {
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      bankerEmail: true,
      role: true,
      branch: true,
    },
  });

  if (!staff) {
    throw new AppError(404, "Staff profile not found");
  }

  return staff;
}

export async function staffLogoutService(
  staffId: string,
  rawRefreshToken: string,
): Promise<void> {
  const incomingHash = crypto
    .createHash("sha256")
    .update(rawRefreshToken)
    .digest("hex");

  const session = await prisma.staffSession.findUnique({
    where: { refreshTokenHash: incomingHash },
    include: { staff: true },
  });

  if (!session || session.isRevoked) {
    throw new AppError(401, "Invalid or revoked staff session");
  }

  await prisma.staffSession.update({
    where: { id: session.id },
    data: { isRevoked: true },
  });

  return;
}
