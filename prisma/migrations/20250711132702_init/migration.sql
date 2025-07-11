/*
  Warnings:

  - You are about to drop the column `Answer_key` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `telegram_id` on the `questions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "questions" DROP COLUMN "Answer_key",
DROP COLUMN "telegram_id";

-- CreateTable
CREATE TABLE "Answers" (
    "id" SERIAL NOT NULL,
    "telegram_id" BIGINT NOT NULL,
    "answer_count" INTEGER NOT NULL,

    CONSTRAINT "Answers_pkey" PRIMARY KEY ("id")
);
