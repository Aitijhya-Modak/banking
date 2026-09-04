import NodeCache from "node-cache";
import { OTP_RESEND_COOLDOWN, OTP_VALID_TIME } from "./constants.js";
import type { AccountType } from "@prisma/client";

export type TempRegistration = {
  userData: {
    firstName: string;
    middleName: string;
    lastName: string;
    email: string;
    accountType: AccountType;
    hashedPassword: string;
  };
  otp: string;
  attempts: number;
};
export const tempRegistrationCache = new NodeCache({
  stdTTL: OTP_VALID_TIME,
  checkperiod: 60,
});

export const resendCooldownCache = new NodeCache({
  stdTTL: OTP_RESEND_COOLDOWN,
  checkperiod: 10,
});
