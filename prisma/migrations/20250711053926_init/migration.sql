-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_telegram_id_fkey" FOREIGN KEY ("telegram_id") REFERENCES "users"("telegram_id") ON DELETE CASCADE ON UPDATE CASCADE;
