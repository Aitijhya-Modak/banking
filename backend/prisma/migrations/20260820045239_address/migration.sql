/*
  Warnings:

  - You are about to drop the column `accountHolderAddress` on the `accounts` table. All the data in the column will be lost.
  - Added the required column `accountHolderAddressId` to the `accounts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "accounts" DROP COLUMN "accountHolderAddress",
ADD COLUMN     "accountHolderAddressId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "address_line_1" TEXT NOT NULL,
    "address_line_2" TEXT,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_accountHolderAddressId_fkey" FOREIGN KEY ("accountHolderAddressId") REFERENCES "Address"("id") ON DELETE CASCADE ON UPDATE CASCADE;
