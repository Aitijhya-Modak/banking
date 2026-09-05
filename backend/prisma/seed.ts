import {
  AccountStatus,
  AccountType,
  StaffRole,
  TransactionType,
} from "@prisma/client";
import bcrypt from "bcrypt";
import { prisma } from "../src/config/db.js";

async function main() {
  console.log("🌱 Starting database seed...");

  await prisma.staffSession.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.loanDetails.deleteMany();
  await prisma.businessDetails.deleteMany();
  await prisma.account.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.address.deleteMany();
  await prisma.branch.deleteMany();

  const hashedPassword = await bcrypt.hash("password", 10);

  const branches = [];

  for (let i = 1; i <= 10; i++) {
    const branch = await prisma.branch.create({
      data: {
        branchId: `BR-${String(i).padStart(3, "0")}`,
        name: `Bank Branch ${i}`,
        address: `${i} Main Street`,
        city: i % 2 === 0 ? "Kolkata" : "Bardhaman",
        country: "India",
      },
    });

    branches.push(branch);
  }

  const addresses = [];

  for (let i = 1; i <= 10; i++) {
    const address = await prisma.address.create({
      data: {
        pincode: `70000${i}`,
        city: i % 2 === 0 ? "Kolkata" : "Bardhaman",
        country: "India",
        addressLine1: `${i} Park Street`,
        addressLine2: i % 2 === 0 ? `Apartment ${i}` : null,
      },
    });

    addresses.push(address);
  }

  const accounts = [];

  for (let i = 1; i <= 10; i++) {
    let type: AccountType = AccountType.SAVINGS;

    if (i === 8 || i === 9) {
      type = AccountType.BUSINESS;
    }

    if (i === 10) {
      type = AccountType.LOAN;
    }

    const account = await prisma.account.create({
      data: {
        accountNo: `100000000${i}`,

        accountHolderFirstName: `Customer${i}`,
        accountHolderMiddleName: i % 3 === 0 ? "K" : null,
        accountHolderLastName: `User${i}`,
        accountHolderEmail: `customer${i}@example.com`,

        accountHolderAddressId: addresses[i - 1]!.id,

        type,
        accountStatus: AccountStatus.OPEN,

        balance: (10000 + i * 2500).toFixed(2),

        branchId: branches[i - 1]!.id,
      },
    });

    accounts.push(account);
  }

  await prisma.loanDetails.create({
    data: {
      accountId: accounts[9]!.id,
      principalAmount: "500000.00",
      interestRate: "8.50",
      termMonths: 60,
    },
  });

  await prisma.businessDetails.createMany({
    data: [
      {
        accountId: accounts[7]!.id,
        taxId: "TAX-BUSINESS-008",
        companyName: "Example Technologies Pvt Ltd",
      },
      {
        accountId: accounts[8]!.id,
        taxId: "TAX-BUSINESS-009",
        companyName: "Example Traders Pvt Ltd",
      },
    ],
  });

  const staffData = [
    {
      firstName: "Admin",
      lastName: "User",
      bankerEmail: "admin@example.com",
      role: StaffRole.ADMIN,
      branchId: branches[0]!.id,
    },
    {
      firstName: "John",
      lastName: "Smith",
      bankerEmail: "john@example.com",
      role: StaffRole.STAFF,
      branchId: branches[1]!.id,
    },
    {
      firstName: "Jane",
      lastName: "Doe",
      bankerEmail: "jane@example.com",
      role: StaffRole.STAFF,
      branchId: branches[2]!.id,
    },
    {
      firstName: "Robert",
      lastName: "Brown",
      bankerEmail: "robert@example.com",
      role: StaffRole.STAFF,
      branchId: branches[3]!.id,
    },
  ];

  await prisma.staff.createMany({
    data: staffData.map((staff) => ({
      ...staff,
      hashedPassword,
    })),
  });

  const transactions = [
    {
      transactionType: TransactionType.DEPOSIT,
      amount: "5000.00",
      receiverId: accounts[0]!.id,
    },
    {
      transactionType: TransactionType.DEPOSIT,
      amount: "7500.00",
      receiverId: accounts[1]!.id,
    },
    {
      transactionType: TransactionType.DEPOSIT,
      amount: "10000.00",
      receiverId: accounts[2]!.id,
    },
    {
      transactionType: TransactionType.WITHDRAWAL,
      amount: "1500.00",
      senderId: accounts[3]!.id,
    },
    {
      transactionType: TransactionType.WITHDRAWAL,
      amount: "2500.00",
      senderId: accounts[4]!.id,
    },
    {
      transactionType: TransactionType.TRANSFER,
      amount: "3000.00",
      senderId: accounts[5]!.id,
      receiverId: accounts[6]!.id,
    },
    {
      transactionType: TransactionType.TRANSFER,
      amount: "4500.00",
      senderId: accounts[6]!.id,
      receiverId: accounts[0]!.id,
    },
    {
      transactionType: TransactionType.TRANSFER,
      amount: "2000.00",
      senderId: accounts[1]!.id,
      receiverId: accounts[2]!.id,
    },
    {
      transactionType: TransactionType.DEPOSIT,
      amount: "12000.00",
      receiverId: accounts[7]!.id,
    },
    {
      transactionType: TransactionType.DEPOSIT,
      amount: "15000.00",
      receiverId: accounts[8]!.id,
    },
  ];

  await prisma.transaction.createMany({
    data: transactions,
  });

  console.log("✅ Seed completed successfully!");
  console.log("Created:");
  console.log("  - 10 branches");
  console.log("  - 10 addresses");
  console.log("  - 10 accounts");
  console.log("  - 2 business accounts");
  console.log("  - 1 loan account");
  console.log("  - 4 staff users");
  console.log("  - 10 transactions");
  console.log("");
  console.log("Staff password: password");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
