/*
  Warnings:

  - A unique constraint covering the columns `[contact]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[telegram_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "users_contact_key" ON "users"("contact");

-- CreateIndex
CREATE UNIQUE INDEX "users_telegram_id_key" ON "users"("telegram_id");
