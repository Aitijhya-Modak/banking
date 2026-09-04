import type { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { AppError } from "../error/AppError.js";

export function validate(schema: z.ZodType) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(new AppError(400, "Invalid Request Body"));
        return;
      }
      next(err);
    }
  };
}
