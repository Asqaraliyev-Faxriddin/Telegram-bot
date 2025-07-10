import { Action, Hears, Ctx, On, Start, Update } from "nestjs-telegraf";
import { PrismaService } from "src/core/prisma/prisma.service";
import { Context } from "telegraf";
import { UserState } from "src/common/user.state";
import { RegistrationService } from "./registration/registration.service";
import { keyboard } from "./reply.keyboard";
import * as path from "path";
import { addTextToImage } from "certificates/sertificat";

@Update()
export class UpdateBot {
  constructor(
    private readonly prisma: PrismaService,
    private readonly registrationService: RegistrationService
  ) {}

  private awaitingPassword = new Map<number, boolean>();
  private tempDeleteTarget = new Map<number, number>();
  private awaitingAdminDelete = new Map<number, boolean>();
  private awaitingSearch = new Map<number, boolean>();

  @Hears("/delete")
  async deleteUser(@Ctx() ctx: Context) {
    try {
      return await this.registrationService.deleteSelf(ctx);
    } catch (err) {
      console.error(err);
       ctx.reply("❌ O'chirishda xatolik yuz berdi.");
       return
    }
  }

  @Hears("/admin_delete")
  async askPasswordForDelete(@Ctx() ctx: Context) {
    this.awaitingAdminDelete.set(ctx.from!.id, true);
     ctx.reply("🛡 Admin parolni kiriting:");
     return
  }

  @Hears("/search")
  async searchStart(@Ctx() ctx: Context) {
    this.awaitingSearch.set(ctx.from!.id, true);
     ctx.reply("🔍 Qidiruv uchun ism yozing:");
     return
  }

  @Hears("/sertificate")
  async handleCertificates(@Ctx() ctx: Context) {
    try {
      return await this.registrationService.handleCertificates(ctx);
       
    } catch (err) {
      console.error(err);
       ctx.reply("❌ Sertifikat olishda kutilmagan xatolik yuz berdi.");
       return
    }
  }

  @Hears("/start_test")
  async startTestHandler(@Ctx() ctx: Context) {
    return this.registrationService.startTest(ctx);
  }


  @Hears("/users")
  async allUsers(@Ctx() ctx: Context) {
    try {
      const needsPassword = await this.registrationService.AllUsers(ctx);
      if (needsPassword) {
        this.awaitingPassword.set(ctx.from!.id, true);
      }
    } catch (err) {
      console.error(err);
       ctx.reply("❌ Userlarni olishda xatolik yuz berdi.");
       return
    }
  }


  @Hears('/help')
async helpCommand(@Ctx() ctx: Context) {
  await ctx.reply(
    `🆘 <b>Yordam menyusi</b>\n\n` +
    `Quyidagi buyruqlar orqali botdan foydalanishingiz mumkin:\n\n` +

    `✅ <b>/start</b> - Ro'yxatdan o'tish jarayonini boshlaydi\n` +
    
    
    `📘 <b>/start_test</b> - Test savollarini boshlaydi\n` +
    
    
    `📄 <b>/sertificate</b> - Sertifikatni yuklab olish\n` +
    
    
    `🗑 <b>/delete</b> - O'z profilingizni o'chirish\n` +
    
    ` <b>/help</b> - Yordam menyusini ko'rsatadi`,
    {
      parse_mode: 'HTML',
      reply_markup: {
        remove_keyboard: true
      }
    }
  );
}


  @Start()
async onStart(@Ctx() ctx: Context) {
  const userId = ctx.from!.id;

  const user = await this.prisma.user.findFirst({ where: { telegram_id: userId } });

  if (user) {
     ctx.reply("✅ Siz allaqachon ro'yxatdan o'tgansiz. /start_test orqali testni boshlang.");
     return
  }

  UserState.set(userId, {
    step: "firstname",
    data: {},
  });

   ctx.reply("👋 Assalomu alaykum! Ismingizni kiriting:");
   return
}

  

  @On("text")
  async onText(@Ctx() ctx: Context) {
    try {
      const userId = ctx.from!.id;
      if (!ctx.message || !('text' in ctx.message)) return ctx.reply("Faqat matn yuboring.");
      const text = ctx.message.text;

      if (this.awaitingPassword.get(userId)) {
        this.awaitingPassword.delete(userId);
        if (text === '11201111') {
          const users = await this.prisma.user.findMany();
          for (const user of users) {
            await ctx.reply(`👤 User:\nIsm: ${user.firstname}\nFamiliya: ${user.lastname}\nYosh: ${user.age}\nViloyat: ${user.region}\nTelefon: ${user.contact}`);
          }
        } else {
           ctx.reply("❌ Parol noto'g'ri!");
           return
        }
        return;
      }

      if (this.awaitingAdminDelete.get(userId)) {
        this.awaitingAdminDelete.delete(userId);
        if (text === '11201111') {
          this.tempDeleteTarget.set(userId, 1);
           ctx.reply("✅ Parol to'g'ri. Endi o'chirmoqchi bo'lgan userning ID sini yuboring:");
           return
        } else {
           ctx.reply("❌ Parol noto'g'ri.");
           return
        }
      }

      if (this.tempDeleteTarget.has(userId)) {
        const targetId = parseInt(text);
        if (isNaN(targetId)) return ctx.reply("❗️Iltimos, to'g'ri ID kiriting.");
        this.tempDeleteTarget.delete(userId);
        return this.registrationService.deleteById(ctx, targetId);
      }

      if (this.awaitingSearch.get(userId)) {
        this.awaitingSearch.delete(userId);
         this.registrationService.searchByName(ctx, text);
         return
      }

      const state = UserState.get(userId);
      if (!state) { ctx.reply("/start ni bosing");
       return }

      switch (state.step) {
        case "firstname":
          state.data.firstname = text;
          state.step = "lastname";
           ctx.reply("Familiyangizni kiriting:");
           return

        case "lastname":
          state.data.lastname = text;
          state.step = "region";
           ctx.reply("Viloyatingizni tanlang:", {
            reply_markup: {
              keyboard: [
                ["Toshkent", "Samarqand"],
                ["Farg'ona", "Andijon"],
                ["Surxondaryo", "Jizzax"],
                ["Buxoro", "Namangan"],
                ["Xorazm", "Sirdaryo"],
                ["Qashqadaryo", "Navoiy"],
                ["Qoraqalpog'iston"]
              ],
              resize_keyboard: true,
              one_time_keyboard: true
            }
          });
          return
        case "region":
          state.data.region = text;
          state.step = "age";
           ctx.reply("Yoshingizni kiriting:");
           return
        case "age":
          const age = parseInt(text);
          if (isNaN(age)) return ctx.reply("Yoshingizni raqam bilan kiriting:");
          state.data.age = age;
          state.step = "contact";
           ctx.reply("Iltimos kontakt yuboring", {
            reply_markup: {
              keyboard: [
                [{ text: "Kontakt yuborish", request_contact: true }]
              ],
              resize_keyboard: true,
              one_time_keyboard: true
            }
          });
          return
        default:
           ctx.reply("Iltimos kontakt yuboring.");

           return
      }
    } catch (err) {
      console.error(err);
       ctx.reply("❌ Matn qabul qilishda xatolik yuz berdi.");
       return
    }
  }

  @On("contact")
  async onContact(@Ctx() ctx: Context) {
    try {
      const userId = ctx.from!.id;
      const state = UserState.get(userId);

      if (!state || state.step !== "contact"){  ctx.reply("/start ni bosing yoki ma'lumotlarni to'ldiring.") 
        return
      } 

      if (!ctx.message || !('contact' in ctx.message)){  ctx.reply("Kontakt noto'g'ri yuborildi."); return }
      const contact = ctx.message.contact.phone_number;

      const oldUser = await this.prisma.user.findFirst({ where: { telegram_id: userId } });
      if (oldUser) return ctx.reply("Siz allaqachon ro'yxatdan o'tgansiz. /delete ni bosing");

      await this.prisma.user.create({
        data: {
          telegram_id: userId,
          firstname: state.data.firstname || "Nomalum",
          lastname: state.data.lastname || "Nomalum",
          region: state.data.region || "Nomalum",
          age: state.data.age || 15,
          contact: contact,
        },
      });

      UserState.delete(userId);
       ctx.reply(`✅ Ro'yxatdan o'tish muvaffaqiyatli yakunlandi.\nSertifikat olish uchun /sertificate ni bosing`, keyboard.main);
       return
    } catch (err) {
      console.error(err);
       ctx.reply("❌ Kontaktni saqlashda xatolik yuz berdi.");
       return
    }
  }

 

  
}