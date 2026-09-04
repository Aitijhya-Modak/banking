import { AccountType } from "@prisma/client";
import { z } from "zod";

export const openAccountSchema = z
  .object({
    accountHolderFirstName: z.string().trim().min(1, "First name is required"),
    accountHolderMiddleName: z.string().trim().optional().or(z.literal("")),
    accountHolderLastName: z.string().trim().min(1, "Last name is required"),
    accountHolderEmail: z.email(),
    type: z.enum(AccountType),
    branchId: z.string().trim(),
    companyName: z.string().trim().optional(),
    taxId: z.string().trim().optional(),
    principalAmount: z.coerce
      .number("Principal Amount must be a number")
      .optional(),
    interestRate: z.coerce.number("Interest rate must be a number").optional(),
    termMonths: z.coerce
      .number("Term months must be an integer")
      .int()
      .optional(),
    accountHolderAddress: z.object({
      addressLine1: z.string().trim().min(1, "Address Line 1 is required"),

      addressLine2: z.string().trim().optional().or(z.literal("")),

      city: z.string().trim().min(1, "City is required"),

      pincode: z.string().trim().min(3, "Pincode is required"),

      country: z.string().trim().min(1, "Country is required"),
    }),
  })
  .superRefine((data, ctx) => {
    if (data.type === "BUSINESS") {
      if (!data.companyName || data.companyName.trim() === "") {
        ctx.addIssue({
          code: "custom",
          message: "Company name is required for Business accounts",
          path: ["companyName"],
        });
      }

      if (!data.taxId || data.taxId.trim() === "") {
        ctx.addIssue({
          code: "custom",
          message: "Tax ID is required for Business accounts",
          path: ["taxId"],
        });
      }
    }

    if (data.type === "LOAN") {
      if (data.principalAmount === undefined || data.principalAmount <= 0) {
        ctx.addIssue({
          code: "custom",
          message: "Principal amount must be greater than 0",
          path: ["principalAmount"],
        });
      }

      if (data.interestRate === undefined || data.interestRate < 0) {
        ctx.addIssue({
          code: "custom",
          message: "Interest rate cannot be negative",
          path: ["interestRate"],
        });
      }

      if (data.termMonths === undefined || data.termMonths <= 0) {
        ctx.addIssue({
          code: "custom",
          message: "Term duration must be at least 1 month",
          path: ["termMonths"],
        });
      }
    }
  });

export type OpenAccountPayload = z.infer<typeof openAccountSchema>;
