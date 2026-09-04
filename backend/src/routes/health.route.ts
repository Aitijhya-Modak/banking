import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/", (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: "Server is healthy and fine",
    });
  } catch (err) {
    next(err);
  }
});
