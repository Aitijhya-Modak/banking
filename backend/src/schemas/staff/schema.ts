import { z } from "zod";

export const staffLoginSchema = z.object({
  bankerEmail: z.email("Invalid banker email address"),
  password: z.string().min(8, "Password is required"),
});

export type StaffLoginPayload = z.infer<typeof staffLoginSchema>;
