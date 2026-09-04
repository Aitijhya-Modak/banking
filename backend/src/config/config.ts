import dotenv from "dotenv";
import { z } from "zod";
import { NODE_PROD, NODE_DEV } from "./constants.js";

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().nonempty(),
  PORT: z.coerce.number(),
  SMTP_HOST: z.string().nonempty(),
  SMTP_PORT: z.coerce.number(),
  SMTP_USER: z.string().nonempty(),
  SMTP_PASSWORD: z.string().nonempty(),
  JWT_SECRET_KEY: z.string().nonempty().length(64),
  JWT_EXPIRES_AT: z.string().nonempty(),
  NODE_ENV: z.enum([NODE_PROD, NODE_DEV]),
});

export type Env = z.infer<typeof envSchema>;

function getEnvVariables(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    throw new Error("ENV variables not initialised");
  }

  return result.data;
}

export const env = getEnvVariables();
