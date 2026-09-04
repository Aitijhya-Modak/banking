import { Router } from "express";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../../middleware/validateAuth.middleware.js";
import { validate } from "../../middleware/validateRequest.middleware.js";
import { openAccountSchema } from "../../schemas/account/account.schema.js";
import {
  accountByAccountNoService,
  openAccountService,
  particularAccountService,
} from "../../service/account/account.service.js";

export const accountRouter = Router();

accountRouter.post(
  "/open-account",
  requireAuth,
  validate(openAccountSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const payload = req.body;
      const account = await openAccountService(payload);

      return res.status(200).json({
        success: true,
        message: "Account opened succesfully",
        accountDetails: account,
      });
    } catch (err) {
      return next(err);
    }
  },
);

accountRouter.get("/search", requireAuth, async (req, res, next) => {
  try {
    const query = req.query.q as string;

    if (!query || query.trim() === "") {
      return res
        .status(200)
        .json({ success: true, message: "Fetched all accounts", data: [] });
    }

    const accounts = await accountByAccountNoService(query.trim());

    return res
      .status(200)
      .json({ success: true, message: "Fetched all accounts", data: accounts });
  } catch (err) {
    return next(err);
  }
});

accountRouter.get("/:accountNo", requireAuth, async (req, res, next) => {
  try {
    const { accountNo } = req.params;

    if (!accountNo || typeof accountNo !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid Request",
      });
    }

    if (!accountNo || accountNo.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Account number parameter is required",
      });
    }

    const account = await particularAccountService(accountNo.trim());

    if (!account) {
      return res.status(404).json({
        success: false,
        message: `Account with number ${accountNo} not found`,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Account details fetched successfully",
      data: account,
    });
  } catch (err) {
    return next(err);
  }
});
