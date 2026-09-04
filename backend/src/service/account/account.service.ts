import { string } from "zod";
import { prisma } from "../../config/db.js";
import type { OpenAccountPayload } from "../../schemas/account/account.schema.js";
import { generateUniqueAccountNo } from "../../utils/account.js";

/**
 * Creates a new bank account with its branch, address, and
 * type-specific business or loan details.
 * @param payload - Account holder, branch, address, and account details.
 * @returns The newly created account with related records.
 */
export async function openAccountService(payload: OpenAccountPayload) {
  const accountNo = await generateUniqueAccountNo();

  const newAccount = await prisma.account.create({
    data: {
      accountNo: accountNo,
      accountHolderFirstName: payload.accountHolderFirstName,
      accountHolderMiddleName: payload.accountHolderMiddleName || null,
      accountHolderLastName: payload.accountHolderLastName,
      accountHolderEmail: payload.accountHolderEmail,
      type: payload.type,
      branch: {
        connect: { id: payload.branchId },
      },

      accountHolderAddress: {
        create: {
          addressLine1: payload.accountHolderAddress.addressLine1,
          addressLine2: payload.accountHolderAddress.addressLine2,
          city: payload.accountHolderAddress.city,
          pincode: payload.accountHolderAddress.pincode,
          country: payload.accountHolderAddress.country,
        },
      },

      ...(payload.type === "BUSINESS" &&
        payload.companyName &&
        payload.taxId && {
          businessDetails: {
            create: {
              companyName: payload.companyName,
              taxId: payload.taxId,
            },
          },
        }),

      ...(payload.type === "LOAN" &&
        payload.principalAmount &&
        payload.interestRate &&
        payload.termMonths && {
          loanDetails: {
            create: {
              principalAmount: payload.principalAmount,
              interestRate: payload.interestRate,
              termMonths: payload.termMonths,
            },
          },
        }),
    },
    include: {
      accountHolderAddress: true,
      businessDetails: true,
      loanDetails: true,
      branch: true,
    },
  });

  return newAccount;
}

export async function accountByAccountNoService(
  query: string,
  limit: number = 5,
) {
  const accounts = await prisma.account.findMany({
    where: {
      accountNo: {
        startsWith: query,
        mode: "insensitive",
      },
    },
    take: Math.min(limit, 20),
    select: {
      accountNo: true,
      accountHolderFirstName: true,
      accountHolderMiddleName: true,
      accountHolderLastName: true,
      type: true,
      createdAt: true,
    },
  });

  return accounts.map((account) => ({
    accountNo: account.accountNo,
    accountHolderName: [
      account.accountHolderFirstName,
      account.accountHolderMiddleName,
      account.accountHolderLastName,
    ]
      .filter(Boolean)
      .join(" "),
    type: account.type,
    createdAt: account.createdAt,
  }));
}

export async function particularAccountService(accountNo: string) {
  const account = await prisma.account.findUnique({
    where: {
      accountNo,
    },
    include: {
      accountHolderAddress: true,
      branch: true,
      loanDetails: true,
      businessDetails: true,
      sentTransactions: {
        take: 10,
        orderBy: {
          createdAt: "desc",
        },
      },
      receivedTransactions: {
        take: 10,
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!account) {
    return null;
  }

  const formattedAccount = {
    ...account,
    accountHolderFullName: [
      account.accountHolderFirstName,
      account.accountHolderMiddleName,
      account.accountHolderLastName,
    ]
      .filter(Boolean)
      .join(" "),
    balance: account.balance.toNumber(),
    loanDetails: account.loanDetails
      ? {
          ...account.loanDetails,
          principalAmount: account.loanDetails.principalAmount.toNumber(),
          interestRate: account.loanDetails.interestRate.toNumber(),
        }
      : null,
    sentTransactions: account.sentTransactions.map((tx) => ({
      ...tx,
      amount: tx.amount?.toNumber ? tx.amount.toNumber() : tx.amount,
    })),
    receivedTransactions: account.receivedTransactions.map((tx) => ({
      ...tx,
      amount: tx.amount?.toNumber ? tx.amount.toNumber() : tx.amount,
    })),
  };

  return formattedAccount;
}
