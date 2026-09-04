import { z } from "zod";

export const AccountTypeEnum = z.enum(["SAVINGS", "BUSINESS", "LOAN"]);

export const openAccountSchema = z
  .object({
    accountType: AccountTypeEnum,

    firstName: z.string().trim().min(1, "First name is required"),
    middleName: z.string().trim().optional(),
    lastName: z.string().trim().min(1, "Last name is required"),
    dob: z.string().min(1, "Date of birth is required"),
    address: z.string().trim().min(5, "Address must be at least 5 characters"),

    branchCode: z.string().trim().min(1, "Branch selection is required"),

    panCard: z
      .string()
      .trim()
      .toUpperCase()
      .regex(
        /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
        "Invalid PAN Card format (e.g., ABCDE1234F)",
      ),
    aadharCard: z
      .string()
      .trim()
      .regex(/^\d{12}$/, "Identity verification number must be 12 digits"),

    companyName: z.string().trim().optional(),
    taxId: z.string().trim().optional(),

    principalAmount: z.coerce.number().optional(),
    termMonths: z.coerce.number().optional(),
    interestRate: z.coerce.number().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.accountType === "BUSINESS") {
      if (!data.companyName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Company name is required for business accounts",
          path: ["companyName"],
        });
      }
      if (!data.taxId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tax ID is required for business accounts",
          path: ["taxId"],
        });
      }
    }

    if (data.accountType === "LOAN") {
      if (!data.principalAmount || data.principalAmount <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Principal amount must be greater than 0",
          path: ["principalAmount"],
        });
      }
      if (!data.termMonths || data.termMonths <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Term duration is required",
          path: ["termMonths"],
        });
      }
    }
  });

export type OpenAccountFormData = z.infer<typeof openAccountSchema>;
