import crypto from "crypto";

export function generate6DigitOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

export function generate16DigitAccountNumber() {
  const prefix = "10";
  const randomDigits = crypto.randomInt(10000000, 99999999).toString();
  return `${prefix}${randomDigits}`;
}
