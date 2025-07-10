// src/modules/bot/registration/registration.service.ts
import { Injectable } from '@nestjs/common';
import { addTextToImage } from 'certificates/sertificat';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { Context, Telegraf } from 'telegraf';
import * as path from "path"
import { InjectBot } from 'nestjs-telegraf';
import { Update } from 'telegraf/typings/core/types/typegram';

@Injectable()
export class RegistrationService {
  constructor(private readonly prisma: PrismaService,@InjectBot() private readonly bot:Telegraf<Context>) {}

  async startTest(ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;
  
    const questions = await this.prisma.questions.findMany({
      where: { telegram_id: 0 },
      orderBy: { id: 'asc' },
      take: 10,
    });
  
    if (!questions.length) {
      return ctx.reply("❌ Hozircha testlar mavjud emas.");
    }
  
    let correct = 0;
  
    for (const question of questions) {
      await ctx.reply(
        `📘 ${question.title}\n\nA) ${question.A}\nB) ${question.B}\nC) ${question.C}\nD) ${question.D}`,
        {
          reply_markup: {
            keyboard: [['A', 'B'], ['C', 'D']],
            one_time_keyboard: true,
            resize_keyboard: true,
          },
        }
      );
  
      const answer: string | null = await new Promise((resolve) => {
        const handler = async (msgCtx: Context) => {
          // Faqat shu userdan bo‘lsa va text bo‘lsa
          if (
            msgCtx.from?.id !== userId ||
            !msgCtx.message ||
            typeof (msgCtx.message as any).text !== 'string'
          ) return;
  
          const text = (msgCtx.message as any).text.trim().toUpperCase();
  
          // @ts-ignore
          if (['A', 'B', 'C', 'D'].includes(text)) {
            (this.bot as any).off('text', handler); // faqat 1 marta ishlasin
            resolve(text);
          } else {
            await msgCtx.reply("❗ Faqat A, B, C yoki D dan birini tanlang.");
          }
        };
  
        (this.bot as any).on('text', handler);
      });
  
      const isCorrect = answer === question.Answer_Key;
      if (isCorrect) correct++;
  
      await this.prisma.questions.update({
        where: { id: question.id },
        data: {
          Answer_count: isCorrect ? question.Answer_count + 1 : question.Answer_count,
          telegram_id: isCorrect ? userId : question.telegram_id,
        },
      });
    }
  
    await ctx.reply(`✅ Test tugadi. Siz ${correct} ta to'g'ri javob berdingiz.`);
  
    if (correct >= 6) {
      await ctx.reply("🎉 Sertifikat olish uchun /sertificate ni bosing.");
    } else {
      await ctx.reply("❌ Afsuski, siz 6 ta to'g'ri javob bera olmadingiz.");
    }
  }
  
  
  
  

  async handleCertificatess(ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;

    const correctCount = await this.prisma.questions.count({
      where: { telegram_id: userId },
    });

    if (correctCount < 6) {
       ctx.reply("❌ Sertifikat olish uchun kamida 6 ta savolga to'g'ri javob berishingiz kerak.");
       return
    }

    const user = await this.prisma.user.findFirst({ where: { telegram_id: userId } });
    if (!user)return  ctx.reply("❌ Siz ro'yxatdan o'tmagansiz.");

    await addTextToImage(user.firstname, user.lastname);
    const filePath = path.join(process.cwd(), 'templates', 'top.jpeg');

    return ctx.replyWithPhoto({ source: filePath }, { caption: "📄 Sertifikatingiz tayyor!" });
  }











  async deleteSelf(ctx: Context) {
    try {
      const userId = ctx.from?.id;
      if (!userId) return ctx.reply("❌ Foydalanuvchi aniqlanmadi.");

      const user = await this.prisma.user.findFirst({
        where: { telegram_id: userId },
      });

      if (!user) {
         ctx.reply(`❌ Siz hali ro'yxatdan o'tmagansiz. /start ni bosing.`);  return
      }

      await this.prisma.user.delete({ where: { telegram_id: userId } });

      return ctx.reply(
        `✅ Ma'lumotlaringiz o'chirildi. Qaytadan ro'yxatdan o'tish uchun /start ni bosing.`,
      );
    } catch (error) {
      console.error("deleteSelf error:", error);
       ctx.reply("❌ Xatolik yuz berdi, qaytadan urinib ko'ring.");
       return
    }
  }

  async deleteById(ctx: Context, targetId: number) {
    try {
      const target = await this.prisma.user.findFirst({
        where: { telegram_id: targetId },
      });

      if (!target) {
        return ctx.reply(`🛑 Bunday foydalanuvchi topilmadi.`);
      }

      await this.prisma.user.delete({ where: { telegram_id: targetId } });

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

      if (users.length === 0) {
         ctx.reply(`🔍 "${search}" bo'yicha hech narsa topilmadi.`);
         return
      }

      for (const user of users) {
        await ctx.reply(`👤 Foydalanuvchi:
🧑 Ism: ${user.firstname}
🔤 Familiya: ${user.lastname}
🆔 ID: ${user.telegram_id}
📞 Tel: ${user.contact || "yo'q"}`);
      }
    } catch (error) {
      console.error("searchByName error:", error);
       ctx.reply("❌ Qidiruvda xatolik yuz berdi.");
       return
    }
  }

  async AllUsers(ctx: Context): Promise<boolean> {
    try {
      const userId = ctx.from?.id;
      if (!userId) return false;


      return true; 
    } catch (error) {
      console.error("AllUsers error:", error);
      return false;
    }
  }



async handleCertificates(ctx: Context) {
    const userId = ctx.from?.id;
    const user = await this.prisma.user.findFirst({ where: { telegram_id: userId } });
  
    if (!user) { ctx.reply("❌ Siz hali ro'yxatdan o'tmagansiz.");
     return }
  
   
    const correctAnswers = await this.prisma.questions.count({
      where: {
        telegram_id: userId,
        Answer_count: 1, 
      }
    });
  
    if (correctAnswers < 6) {
       ctx.reply(`📉 Siz hozircha ${correctAnswers} ta testdan to'g'ri javob berdingiz. Kamida 6 ta kerak.`);
       return
    }
  
    const now = new Date();
    const lastTime = user.sertificatian_Date;
    const twoHours = 2 * 60 * 60 * 1000;
  
    if (user.sertificat_count >= 3 && now.getTime() - new Date(lastTime).getTime() < twoHours) {
       ctx.reply("❌ 3 martadan ko'p urindingiz. 2 soatdan keyin yana urinib ko'ring.");
       return
    }
  
    if (user.sertificat_count >= 3) {
      user.sertificat_count = 0;
    }
  
    await addTextToImage(user.firstname, user.lastname);
    const filePath = path.join(process.cwd(), 'templates', 'top.jpeg');
  
    await this.prisma.user.update({
      where: { telegram_id: userId },
      data: {
        sertificat_count: user.sertificat_count + 1,
        sertificatian_Date: new Date(),
      },
    });
  
     ctx.replyWithPhoto({ source: filePath }, { caption: "📄 Sertifikatingiz tayyor!" });
     return
  }


  
  
  
}

  
  

  

  

