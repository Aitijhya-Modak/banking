import { z } from "zod";
import { TransactionType } from "@prisma/client";

export const masterTransactionQuerySchema = z.object({
  // Pagination
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),

  // Account Filters (by accountNo)
  accountNo: z.string().trim().optional(), // Filters transactions where account is sender OR receiver
  senderAccountNo: z.string().trim().optional(),
  receiverAccountNo: z.string().trim().optional(),

  // Transaction Type Filter
  transactionType: z.enum(TransactionType).optional(),

  // Date Range Filters
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),

  // Amount Filters
  minAmount: z.coerce.number().nonnegative().optional(),
  maxAmount: z.coerce.number().nonnegative().optional(),

  // Sorting Options
  sortBy: z
    .enum(["createdAt", "amount", "transactionType"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type MasterTransactionQueryPayload = z.infer<
  typeof masterTransactionQuerySchema
>;

export const depositSchema = z.object({
  accountNo: z.string().min(1, "Account number is required"),
  amount: z.number().positive().multipleOf(0.01),
});

export const withdrawSchema = z.object({
  accountNo: z.string().min(1, "Account number is required"),
  amount: z.number().positive().multipleOf(0.01),
});

export const transferSchema = z
  .object({
    senderAccountNo: z.string().min(1, "Sender account number is required"),
    receiverAccountNo: z.string().min(1, "Receiver account number is required"),
    amount: z.number().positive().multipleOf(0.01),
  })
  .refine((data) => data.senderAccountNo !== data.receiverAccountNo, {
    message: "Sender and receiver accounts cannot be the same",
    path: ["receiverAccountNo"],
  });

export type DepositPayload = z.infer<typeof depositSchema>;
export type WithdrawPayload = z.infer<typeof withdrawSchema>;
export type TransferPayload = z.infer<typeof transferSchema>;
