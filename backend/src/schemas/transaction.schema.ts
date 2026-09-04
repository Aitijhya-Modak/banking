import { z } from "zod";

export const sendMoneySchema = z.object({
  fromAccountNo: z.string("Sender account number is required"),
  toAccountNo: z.string("Receiver account number is required"),
  amount: z.number().positive("Amount must be greater than 0"),
});

export type SendMoneyPayload = z.infer<typeof sendMoneySchema>;
