import type { NextFunction, Request, Response } from "express";
import { AppError } from "./AppError.js";
import { ZodError } from "zod";

export function handleError(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (err instanceof AppError) {
    res.status(err.status).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // unhandled error
  console.log(err);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
}
