/*
  Warnings:

  - You are about to drop the column `user_id` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `accountHolderAddress` to the `accounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `accountHolderEmail` to the `accounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `accountHolderFirstName` to the `accounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `accountHolderLastName` to the `accounts` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_user_id_fkey";

-- AlterTable
ALTER TABLE "accounts" DROP COLUMN "user_id",
ADD COLUMN     "accountHolderAddress" TEXT NOT NULL,
ADD COLUMN     "accountHolderEmail" TEXT NOT NULL,
ADD COLUMN     "accountHolderFirstName" TEXT NOT NULL,
ADD COLUMN     "accountHolderLastName" TEXT NOT NULL,
ADD COLUMN     "accountHolderMiddleName" TEXT;

-- DropTable
DROP TABLE "users";
