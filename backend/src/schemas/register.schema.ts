import { AccountType } from "@prisma/client";
import { email, z } from "zod";

export const initiateRegistrationSchema = z.object({
  firstName: z.string().nonempty(),
  lastName: z.string().nonempty(),
  middleName: z.string(),
  email: z.email(),
  password: z.string().min(8),
  accountType: z.enum([AccountType.BUSINESS, AccountType.SAVINGS]),
});
export type InitiateRegistrationPayload = z.infer<
  typeof initiateRegistrationSchema
>;

export const verifySchema = z.object({
  email: z.email(),
  submittedOtp: z.string().length(6),
});
export type VerifyPayload = z.infer<typeof verifySchema>;

export const resendOtpSchema = z.object({
  email: z.email(),
});
export type ResendOtpPayload = z.infer<typeof resendOtpSchema>;
