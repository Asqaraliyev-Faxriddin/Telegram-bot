// src/modules/bot/registration/registration.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { addTextToImage } from 'certificates/sertificat';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { Context, Telegraf } from 'telegraf';
import * as path from 'path';
import { InjectBot } from 'nestjs-telegraf';

export const userTestStates = new Map<number, {
  index: number,
  correct: number,
  questions: any[]
}>();

@Injectable()
export class RegistrationService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    @InjectBot() private readonly bot: Telegraf<Context>
  ) {}

  async onModuleInit() {
    this.bot.on('text', async (ctx) => {
      const userId = ctx.from?.id;
      if (!userId) return;
  
      const state = userTestStates.get(userId);
      if (!state) return;
  
      const text = (ctx.message as any).text?.trim().toUpperCase();
      // @ts-ignore
      if (!['A', 'B', 'C', 'D'].includes(text)) {
        await ctx.reply("❗ Faqat A, B, C yoki D dan birini tanlang.");
        return;
      }
  
      const currentQuestion = state.questions[state.index];
      const isCorrect = text === currentQuestion.Answer_Key;
  
      if (isCorrect) state.correct++;
  
      // Savol o‘zgartirilmaydi, Questions jadvalidan update olib tashlandi
  
      state.index++;
  
      // Test tugaganda
      if (state.index >= state.questions.length) {
        userTestStates.delete(userId);
  
        // Answers jadvalidan bor-yo‘qligini tekshiramiz
        const existingAnswer = await this.prisma.answers.findFirst({
          where: { telegram_id: BigInt(userId) }
        });
  
        if (existingAnswer) {
          // Yangilaymiz
          await this.prisma.answers.update({
            where: { id: existingAnswer.id },
            data: { answer_count: state.correct }
          });
        } else {
          // Yangi javob yozamiz
          await this.prisma.answers.create({
            data: {
              telegram_id: BigInt(userId),
              answer_count: state.correct
            }
          });
        }
  
        // Natijani yuborish
        await ctx.reply(`✅ Test tugadi. Siz ${state.correct} ta to'g'ri javob berdingiz.`);
        if (state.correct >= 6) {
          await ctx.reply("🎉 Sertifikat olish uchun /sertificate ni bosing.");
        } else {
          await ctx.reply("❌ Afsuski, siz 6 ta to'g'ri javob bera olmadingiz.");
        }
      } else {
        const next = state.questions[state.index];
        await ctx.reply(
          `📘 ${next.title}\n\nA) ${next.A}\nB) ${next.B}\nC) ${next.C}\nD) ${next.D}`,
          {
            reply_markup: {
              keyboard: [['A', 'B'], ['C', 'D']],
              one_time_keyboard: true,
              resize_keyboard: true,
            },
          }
        );
      }
    });
  }
  

  async startTest(ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;
  
    // Avval ro'yxatdan o'tganini tekshiramiz
    const user = await this.prisma.user.findFirst({
      where: { telegram_id: userId },
    });
  
    if (!user) {
      await ctx.reply("❌ Siz hali ro'yxatdan o'tmagansiz. Iltimos /start ni bosing.");
      return;
    }
  
    // Avval testga yozilgan bo'lsa, qayta yozilishiga yo'l qo'ymaymiz
    if (userTestStates.has(userId)) {
      await ctx.reply("❗ Siz allaqachon testni boshlagansiz. Javobni A, B, C yoki D shaklida yuboring.");
      return;
    }
  
    // Savollarni olib kelamiz
    const questions = await this.prisma.questions.findMany({
      
      orderBy: { id: 'asc' },
      take: 10,
    });
  
    if (!questions.length) {
      await ctx.reply("❌ Hozircha testlar mavjud emas.");
      return;
    }
  
    // Test holatini saqlaymiz
    userTestStates.set(userId, {
      questions,
      index: 0,
      correct: 0,
    });
  
    const first = questions[0];
  
    await ctx.reply(
      `📘 ${first.title}\n\nA) ${first.A}\nB) ${first.B}\nC) ${first.C}\nD) ${first.D}`,
      {
        reply_markup: {
          keyboard: [['A', 'B'], ['C', 'D']],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      }
    );
  }
  

  async handleCertificates(ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) {
      await ctx.reply("❌ Foydalanuvchi aniqlanmadi.");
      return;
    }
  
    const user = await this.prisma.user.findFirst({
      where: { telegram_id: BigInt(userId) }
    });
  
    if (!user) {
      await ctx.reply("❌ Siz hali ro'yxatdan o'tmagansiz.");
      return;
    }
  
    const userAnswers = await this.prisma.answers.findFirst({
      where: { telegram_id: BigInt(userId) }
    });
  
    const correctAnswers = userAnswers?.answer_count || 0;
  
    if (correctAnswers < 6) {
      await ctx.reply(`📉 Siz hozircha ${correctAnswers} ta testdan to'g'ri javob berdingiz. Kamida 6 ta kerak.\nTestni takroran boshlash uchun: 🧪 Testni boshlash`);
      return;
    }
  
    const now = new Date();
    const lastTime = user.sertificatian_Date;
    const twoHours = 2 * 60 * 60 * 1000;
    const timeDiff = lastTime ? now.getTime() - new Date(lastTime).getTime() : Infinity;
  
    if (user.sertificat_count >= 3 && timeDiff < twoHours) {
      await ctx.reply("❌ 3 martadan ko'p urindingiz. 2 soatdan keyin yana urinib ko'ring.");
      return;
    }
  
    const updatedCount = user.sertificat_count >= 3 ? 1 : user.sertificat_count + 1;
  
    await addTextToImage(user.firstname, user.lastname);
    const filePath = path.join(process.cwd(), 'templates', 'top.jpeg');
  
    await this.prisma.user.update({
      where: { telegram_id: BigInt(userId) },
      data: {
        sertificat_count: updatedCount,
        sertificatian_Date: new Date(),
      },
    });
  
    await ctx.replyWithPhoto({ source: filePath }, {
      caption: "📄 Sertifikatingiz tayyor!"
    });
  }
  

  async deleteSelf(ctx: Context) {
    try {
      const userId = ctx.from?.id;
      if (!userId) return await ctx.reply("❌ Foydalanuvchi aniqlanmadi.");
  
      const user = await this.prisma.user.findFirst({
        where: { telegram_id: BigInt(userId) }
      });
  
      if (!user) {
        return await ctx.reply("❌ Siz hali ro'yxatdan o'tmagansiz. /start ni bosing.");
      }
  
      await this.prisma.answers.deleteMany({
        where: { telegram_id: BigInt(userId) }
      });
  
      await this.prisma.user.delete({
        where: { telegram_id: BigInt(userId) }
      });
  
      return ctx.reply("✅ Ma'lumotlaringiz va test javoblaringiz o'chirildi. Qaytadan ro'yxatdan o'tish uchun /start ni bosing.");
    } catch (error) {
      console.error("deleteSelf error:", error);
      return ctx.reply("❌ Xatolik yuz berdi, qaytadan urinib ko'ring.");
    }
  }
  

  async deleteById(ctx: Context, targetId: number) {
    try {
      const target = await this.prisma.user.findFirst({
        where: { telegram_id: BigInt(targetId) }
      });
  
      if (!target) return ctx.reply(`🛑 Bunday foydalanuvchi topilmadi.`);
  
      await this.prisma.user.delete({
        where: { telegram_id: BigInt(targetId) }
      });
  
      return ctx.reply(`🗑 Foydalanuvchi ID ${targetId} muvaffaqiyatli o'chirildi.`);
    } catch (error) {
      console.error("deleteById error:", error);
      return ctx.reply("❌ Foydalanuvchini o'chirishda xatolik yuz berdi.");
    }
  }
  

  async searchByName(ctx: Context, search: string) {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          firstname: {
            contains: search,
            mode: 'insensitive',
          },
        },
      });

      if (!users.length) {
        return ctx.reply(`🔍 \"${search}\" bo'yicha hech narsa topilmadi.`);
      }

      for (const user of users) {
        await ctx.reply(`👤 Foydalanuvchi:\n🧑 Ism: ${user.firstname}\n🔤 Familiya: ${user.lastname}\n🆔 ID: ${user.telegram_id}\n📞 Tel: ${user.contact || "yo'q"}`);
      }
    } catch (error) {
      console.error("searchByName error:", error);
      return ctx.reply("❌ Qidiruvda xatolik yuz berdi.");
    }
  }

  async AllUsers(ctx: Context): Promise<boolean> {
    const userId = ctx.from?.id;
  
    if (!userId) {
      await ctx.reply("❗ Foydalanuvchi aniqlanmadi.");
      return false;
    }
  
    try {
      const status = (await ctx.telegram.getChatMember("@Faxriddin_clever", userId)).status;
  
      if (status !== "creator") {
        await ctx.reply("🛡 Iltimos, admin parolni kiriting:");
        return true;
      }
  
      const users = await this.prisma.user.findMany();
  
      for (const user of users) {
        await ctx.reply(
          `👤 Foydalanuvchi:\n🧑 Ism: ${user.firstname}\n🔤 Familiya: ${user.lastname}\n🆔 ID: ${user.telegram_id}\n🔗 Yosh: @${user.age || "yo'q"}\n📞 Tel: ${user.contact || "yo'q"}`
        );
      }
  
      return false;
    } catch (error) {
      console.error("AllUsers error:", error);
      await ctx.reply("❌ Foydalanuvchilarni olishda xatolik yuz berdi.");
      return false;
    }
  }
  
}