import { email, z } from "zod";

export const loginRequestSchema = z.object({
  email: z.email(),
  password: z.string().nonempty(),
});

export type LoginRequestPayload = z.infer<typeof loginRequestSchema>;
