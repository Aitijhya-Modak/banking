/*
  Warnings:

  - You are about to drop the `Address` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_accountHolderAddressId_fkey";

-- DropTable
DROP TABLE "Address";

-- CreateTable
CREATE TABLE "addresses" (
    "id" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "address_line_1" TEXT NOT NULL,
    "address_line_2" TEXT,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_accountHolderAddressId_fkey" FOREIGN KEY ("accountHolderAddressId") REFERENCES "addresses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
