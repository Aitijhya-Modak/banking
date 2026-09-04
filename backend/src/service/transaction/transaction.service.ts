import { TransactionType, type Prisma } from "@prisma/client";
import { prisma } from "../../config/db.js";
import type {
  DepositPayload,
  MasterTransactionQueryPayload,
  TransferPayload,
  WithdrawPayload,
} from "../../schemas/transaction/transactions.schema.js";
import { Decimal } from "@prisma/client/runtime/client";

export async function masterTransactionsService(
  query: MasterTransactionQueryPayload,
) {
  const {
    page,
    limit,
    accountNo,
    senderAccountNo,
    receiverAccountNo,
    transactionType,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    sortBy,
    sortOrder,
  } = query;

  const skip = (page - 1) * limit;

  // Build dynamic Prisma WHERE conditions
  const whereConditions: Prisma.TransactionWhereInput[] = [];

  // 1. Account Number Filter (Sender OR Receiver)
  if (accountNo) {
    whereConditions.push({
      OR: [
        {
          senderAccount: {
            accountNo: { equals: accountNo, mode: "insensitive" },
          },
        },
        {
          receiverAccount: {
            accountNo: { equals: accountNo, mode: "insensitive" },
          },
        },
      ],
    });
  }

  // Explicit Sender Account Filter
  if (senderAccountNo) {
    whereConditions.push({
      senderAccount: {
        accountNo: { equals: senderAccountNo, mode: "insensitive" },
      },
    });
  }

  // Explicit Receiver Account Filter
  if (receiverAccountNo) {
    whereConditions.push({
      receiverAccount: {
        accountNo: { equals: receiverAccountNo, mode: "insensitive" },
      },
    });
  }

  // 2. Transaction Type Filter
  if (transactionType) {
    whereConditions.push({ transactionType });
  }

  // 3. Date Range Filter
  if (startDate || endDate) {
    whereConditions.push({
      createdAt: {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      },
    });
  }

  // 4. Amount Range Filter
  if (minAmount !== undefined || maxAmount !== undefined) {
    whereConditions.push({
      amount: {
        ...(minAmount !== undefined && { gte: minAmount }),
        ...(maxAmount !== undefined && { lte: maxAmount }),
      },
    });
  }

  const where: Prisma.TransactionWhereInput =
    whereConditions.length > 0 ? { AND: whereConditions } : {};

  // Execute queries concurrently for speed
  const [transactions, totalRecords] = await Promise.all([
    prisma.transaction.findMany({
      where,
      take: limit,
      skip,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        senderAccount: {
          select: {
            id: true,
            accountNo: true,
            accountHolderFirstName: true,
            accountHolderLastName: true,
          },
        },
        receiverAccount: {
          select: {
            id: true,
            accountNo: true,
            accountHolderFirstName: true,
            accountHolderLastName: true,
          },
        },
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  const totalPages = Math.ceil(totalRecords / limit);

  return {
    transactions,
    pagination: {
      totalRecords,
      currentPage: page,
      totalPages,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

export async function depositMoneyService(data: DepositPayload) {
  return await prisma.$transaction(async (tx) => {
    const account = await tx.account.findUnique({
      where: { accountNo: data.accountNo },
    });

    if (!account || account.accountStatus !== "OPEN") {
      throw new Error("Account not found or not active");
    }

    const updatedAccount = await tx.account.update({
      where: { accountNo: data.accountNo },
      data: {
        balance: {
          increment: new Decimal(data.amount),
        },
      },
    });

    const transaction = await tx.transaction.create({
      data: {
        transactionType: TransactionType.DEPOSIT,
        amount: new Decimal(data.amount),
        receiverId: account.id, // Relates to Account.id via internal foreign key
      },
    });

    return { account: updatedAccount, transaction };
  });
}

export async function withdrawMoneyService(data: WithdrawPayload) {
  return await prisma.$transaction(async (tx) => {
    const account = await tx.account.findUnique({
      where: { accountNo: data.accountNo },
    });

    if (!account || account.accountStatus !== "OPEN") {
      throw new Error("Account not found or not active");
    }

    if (account.balance.lessThan(data.amount)) {
      throw new Error("Insufficient funds");
    }

    const updatedAccount = await tx.account.update({
      where: { accountNo: data.accountNo },
      data: {
        balance: {
          decrement: new Decimal(data.amount),
        },
      },
    });

    const transaction = await tx.transaction.create({
      data: {
        transactionType: TransactionType.WITHDRAWAL,
        amount: new Decimal(data.amount),
        senderId: account.id,
      },
    });

    return { account: updatedAccount, transaction };
  });
}

export async function transferMoneyService(data: TransferPayload) {
  return await prisma.$transaction(async (tx) => {
    const [sender, receiver] = await Promise.all([
      tx.account.findUnique({ where: { accountNo: data.senderAccountNo } }),
      tx.account.findUnique({ where: { accountNo: data.receiverAccountNo } }),
    ]);

    if (!sender || sender.accountStatus !== "OPEN") {
      throw new Error("Sender account not found or not active");
    }

    if (!receiver || receiver.accountStatus !== "OPEN") {
      throw new Error("Receiver account not found or not active");
    }

    if (sender.balance.lessThan(data.amount)) {
      throw new Error("Insufficient funds");
    }

    const updatedSender = await tx.account.update({
      where: { accountNo: data.senderAccountNo },
      data: { balance: { decrement: new Decimal(data.amount) } },
    });

    const updatedReceiver = await tx.account.update({
      where: { accountNo: data.receiverAccountNo },
      data: { balance: { increment: new Decimal(data.amount) } },
    });

    const transaction = await tx.transaction.create({
      data: {
        transactionType: TransactionType.TRANSFER,
        amount: new Decimal(data.amount),
        senderId: sender.id,
        receiverId: receiver.id,
      },
    });

    return { sender: updatedSender, receiver: updatedReceiver, transaction };
  });
}
