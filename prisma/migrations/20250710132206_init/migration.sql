-- CreateTable
CREATE TABLE "Questions" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    "C" TEXT NOT NULL,
    "D" TEXT NOT NULL,
    "Answer_Key" TEXT NOT NULL,
    "Answer_count" INTEGER NOT NULL,
    "telegram_id" INTEGER NOT NULL,

    CONSTRAINT "Questions_pkey" PRIMARY KEY ("id")
);
