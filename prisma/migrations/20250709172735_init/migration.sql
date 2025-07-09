/*
  Warnings:

  - You are about to drop the column `sertificat_status` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "sertificat_status",
ADD COLUMN     "sertificat_count" INTEGER NOT NULL DEFAULT 0;
