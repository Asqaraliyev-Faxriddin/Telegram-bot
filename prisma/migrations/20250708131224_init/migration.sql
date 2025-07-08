/*
  Warnings:

  - Changed the type of `telegram_id` on the `users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "telegram_id",
ADD COLUMN     "telegram_id" INTEGER NOT NULL;
