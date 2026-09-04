import type { NextFunction, Request, Response } from "express";

export function notFoundRoute(req: Request, res: Response, next: NextFunction) {
  res.status(404).json({
    success: false,
    message: "Route Not Found",
  });
}
