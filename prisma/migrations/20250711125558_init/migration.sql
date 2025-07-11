/*
  Warnings:

  - You are about to drop the column `Answer_count` on the `questions` table. All the data in the column will be lost.
  - Added the required column `Answer_key` to the `questions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "questions" DROP COLUMN "Answer_count",
ADD COLUMN     "Answer_key" BOOLEAN NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
