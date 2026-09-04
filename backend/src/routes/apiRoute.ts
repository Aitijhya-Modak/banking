import { Router } from "express";
import { healthRouter } from "./health.route.js";
import { staffAuthRouter } from "./staff/auth/staffAuth.route.js";
import { accountRouter } from "./account/account.route.js";
import { transactionRouter } from "./transaction/transactions.route.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/staff/auth", staffAuthRouter);
apiRouter.use("/account", accountRouter);
apiRouter.use("/transaction", transactionRouter);
