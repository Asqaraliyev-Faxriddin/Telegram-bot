/*
  Warnings:

  - You are about to drop the `Questions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Questions";

-- CreateTable
CREATE TABLE "questions" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    "C" TEXT NOT NULL,
    "D" TEXT NOT NULL,
    "Answer_Key" TEXT NOT NULL,
    "Answer_count" INTEGER NOT NULL,
    "telegram_id" BIGINT NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);
