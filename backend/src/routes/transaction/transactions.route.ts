import { Router } from "express";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../../middleware/validateAuth.middleware.js";
import {
  depositSchema,
  masterTransactionQuerySchema,
  transferSchema,
  withdrawSchema,
} from "../../schemas/transaction/transactions.schema.js";
import {
  depositMoneyService,
  masterTransactionsService,
  transferMoneyService,
  withdrawMoneyService,
} from "../../service/transaction/transaction.service.js";
import { validate } from "../../middleware/validateRequest.middleware.js";
import { resendCooldownCache } from "../../config/cache.js";
import { TransactionType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/client";
import { prisma } from "../../config/db.js";

export const transactionRouter = Router();

transactionRouter.get(
  "/",
  requireAuth,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const queryValidation = masterTransactionQuerySchema.safeParse(req.query);

      if (!queryValidation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid query parameters provided.",
          errors: queryValidation.error.format(),
        });
      }

      const result = await masterTransactionsService(queryValidation.data);

      return res.status(200).json({
        success: true,
        data: result.transactions,
        pagination: result.pagination,
      });
    } catch (err) {
      return next(err);
    }
  },
);

transactionRouter.post(
  "/deposit",
  requireAuth,
  validate(depositSchema),
  async (req, res, next) => {
    try {
      const result = await depositMoneyService(req.body);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      return next(error);
    }
  },
);

transactionRouter.post(
  "/withdraw",
  validate(withdrawSchema),
  async (req, res, next) => {
    try {
      const result = await withdrawMoneyService(req.body);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      return next(error);
    }
  },
);

transactionRouter.post(
  "/transfer",
  requireAuth,
  validate(transferSchema),
  async (req, res, next) => {
    try {
      const result = await transferMoneyService(req.body);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      return next(error);
    }
  },
);

transactionRouter.post("/pay-emi", requireAuth, async (req, res, next) => {
  try {
    const { accountNo, amount } = req.body;

    if (typeof accountNo !== "string" || accountNo.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "A valid account number is required.",
      });
    }

    if (
      amount === undefined ||
      amount === null ||
      amount === "" ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment amount must be a valid number greater than 0.",
      });
    }

    const paymentAmount = new Decimal(amount);

    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.account.findUnique({
        where: {
          accountNo: accountNo.trim(),
        },
        include: {
          loanDetails: true,
        },
      });

      if (!account) {
        throw new Error("Account not found");
      }

      if (account.accountStatus !== "OPEN") {
        throw new Error("Account is not active");
      }

      if (account.type !== "LOAN") {
        throw new Error("EMI payment is only available for loan accounts");
      }

      if (!account.loanDetails) {
        throw new Error("Loan details not found for this account");
      }

      const principal = new Decimal(account.loanDetails.principalAmount);

      const interestRate = new Decimal(account.loanDetails.interestRate);

      const termYears = new Decimal(account.loanDetails.termMonths).div(12);

      const totalInterest = principal.mul(interestRate).mul(termYears).div(100);

      const isFirstPayment = account.balance.equals(0);

      let totalPayable: Decimal;

      if (isFirstPayment) {
        totalPayable = principal.add(totalInterest);

        await tx.loanDetails.update({
          where: {
            accountId: account.id,
          },
          data: {
            principalAmount: totalPayable,
          },
        });
      } else {
        totalPayable = principal;
      }

      const remainingAmount = totalPayable.sub(account.balance);

      if (remainingAmount.lessThanOrEqualTo(0)) {
        throw new Error("This loan has already been fully paid");
      }

      if (paymentAmount.greaterThan(remainingAmount)) {
        throw new Error(
          `Payment amount cannot exceed the remaining loan amount of ₹${remainingAmount.toFixed(
            2,
          )}`,
        );
      }

      const updatedAccount = await tx.account.update({
        where: {
          id: account.id,
        },
        data: {
          balance: {
            increment: paymentAmount,
          },
        },
        include: {
          loanDetails: true,
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          transactionType: TransactionType.DEPOSIT,
          amount: paymentAmount,
          receiverId: account.id,
        },
      });

      return {
        account: updatedAccount,
        transaction,
        payment: {
          amount: paymentAmount,
          totalInterest,
          totalPayable,
          remainingAmount: remainingAmount.sub(paymentAmount),
        },
      };
    });

    return res.status(200).json({
      success: true,
      message: "EMI payment successful",
      data: result,
    });
  } catch (err) {
    return next(err);
  }
});
