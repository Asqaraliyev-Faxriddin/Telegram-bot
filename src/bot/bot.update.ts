import { Action, Hears, Ctx, On, Start, Update } from "nestjs-telegraf";
import { PrismaService } from "src/core/prisma/prisma.service";
import { Context } from "telegraf";
import { UserState } from "src/common/user.state";
import { RegistrationService, userTestStates } from "./registration/registration.service";
import { keyboard } from "./reply.keyboard";
import { AdminUtils } from "./bot.actions"; // ✅ to'g'ri import

@Update()
export class UpdateBot {
  private readonly newadminUtils: AdminUtils;

  constructor(
    private readonly prisma: PrismaService,
    private readonly registrationService: RegistrationService
  ) {
    this.newadminUtils = new AdminUtils(this.prisma);
  }

  private awaitingPassword = new Map<number, boolean>();
  private tempDeleteTarget = new Map<number, boolean>();
  private awaitingAdminDelete = new Map<number, boolean>();
  private awaitingSearch = new Map<number, boolean>();
  private awaitingBlock = new Map<number, string>();
  private awaitingAddAdmin = new Map<number, boolean>();

  @Hears('📊 Statistika')
async handleStats(@Ctx() ctx: Context) {
  const userId = ctx.from?.id;
  if (!userId) return;

  // Faqat adminlar kirishi uchun
  const user = await this.prisma.user.findFirst({ where: { telegram_id: BigInt(userId) } });
  const status = (await ctx.telegram.getChatMember('@Faxriddin_clever', userId)).status;

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' || status === 'creator';
  if (!isAdmin) return ctx.reply('❌ Sizda ruxsat yoq.');

  const totalUsers = await this.prisma.user.count();
  const activeUsers = await this.prisma.user.count({ where: { isActive: true } });
  const certificateUsers = await this.prisma.user.count({ where: { sertificat_count: { gt: 0 } } });
  const testers = await this.prisma.answers.count();
  const superAdmins = await this.prisma.user.count({ where: { role: 'SUPERADMIN' } });
  const admins = await this.prisma.user.count({ where: { role: 'ADMIN' } });

  await ctx.reply(
    `📊 <b>Statistika:</b>\n\n` +
    `👥 Jami foydalanuvchilar: <b>${totalUsers}</b>\n` +
    `✅ Aktiv foydalanuvchilar: <b>${activeUsers}</b>\n` +
    `🎓 Sertifikat olganlar: <b>${certificateUsers}</b>\n` +
    `🧪 Testni bajarganlar: <b>${testers}</b>\n` +
    `👑 SUPERADMINlar: <b>${superAdmins}</b>\n` +
    `🛡 ADMINlar: <b>${admins}</b>`,
    { parse_mode: 'HTML' }
  );
}


@Hears('✅ Test yuborish')
async handleSendTest(@Ctx() ctx: Context) {
  const userId = ctx.from?.id;
  if (!userId) return;

  const user = await this.prisma.user.findFirst({ where: { telegram_id: BigInt(userId) } });
  const status = (await ctx.telegram.getChatMember('@Faxriddin_clever', userId)).status;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' || status === 'creator';
  if (!isAdmin)  {ctx.reply('❌ Sizda ruxsat yoq.');
   return}

  await ctx.reply('📝 Test yuborish funksiyasi hali toliq ishlanmadi. Tez orada faollashtiriladi.');
  // Optional: bu yerga test qoshish vaqti kelganda logika kiritiladi
}

@Hears('🧪 Testni boshlash')
async handleStartTestButton(@Ctx() ctx: Context) {
  if (await this.newadminUtils.isUserBlocked(ctx)) return;
  return this.registrationService.startTest(ctx);
}

@Hears("➕ Admin qo'shish")
async handleAddAdminStart(@Ctx() ctx: Context) {
  if (!(await this.newadminUtils.restrictToSuperAdminOnly(ctx))) return;

  this.awaitingAddAdmin.set(ctx.from!.id, true);
  await ctx.reply("👤 Admin qilish uchun foydalanuvchining Telegram ID sini yuboring:");
}

  @Hears("/delete")
  async deleteUser(@Ctx() ctx: Context) {
    if (await this.newadminUtils.isUserBlocked(ctx)) return;
    try {
      await this.registrationService.deleteSelf(ctx);
    } catch (err) {
      console.error(err);
      await ctx.reply("❌ O'chirishda xatolik yuz berdi.");
    }
  }

  @Hears("💖Admin o'chirish")
  async askPasswordForDelete(@Ctx() ctx: Context) {
    if (!(await this.newadminUtils.restrictToAdminsOnly(ctx))) return;``
    this.awaitingAdminDelete.set(ctx.from!.id, true);
    await ctx.reply("🛡 Admin parolni kiriting:");
  }

  @Hears("😎Search")
  async searchStart(@Ctx() ctx: Context) {
    const userId = ctx.from!.id;
  
    const isAdmin = await this.newadminUtils.isAdmin(userId, ctx);
    if (!isAdmin) {
      await ctx.reply("❌ Sizda bu buyruqni bajarish uchun ruxsat yo'q.");
      return;
    }
  
    this.awaitingSearch.set(userId, true);
    await ctx.reply("🔍 Qidiruv uchun ism yozing:");
  }
  
  @Hears("👥 Foydalanuvchilar")
  async allUsers(@Ctx() ctx: Context) {
    if (!(await this.newadminUtils.isAdmin(ctx.from!.id,ctx))) return;
    try {
      const needsPassword = await this.registrationService.AllUsers(ctx);
      if (needsPassword === true) {
        this.awaitingPassword.set(ctx.from!.id, true);
      }
    } catch (err) {
      console.error(err);
      await ctx.reply("❌ Userlarni olishda xatolik yuz berdi.");
    }
  }

  @Hears("🚫 Bloklash")
  async handleBlockCommand(@Ctx() ctx: Context) {
    if (!(await this.newadminUtils.restrictToAdminsOnly(ctx))) return;
  
    const userId = ctx.from!.id;
    this.awaitingBlock.set(userId, "block"); 
  
    await ctx.reply("🔢 Bloklamoqchi bolgan foydalanuvchining Telegram ID sini yuboring:");
  }


  @Hears("🚫 Blokldan chiqarish")
  async handleunBlockCommand(@Ctx() ctx: Context) {
    if (!(await this.newadminUtils.restrictToAdminsOnly(ctx))) return;
  
    const userId = ctx.from!.id;
    this.awaitingBlock.set(userId, "unblock");
  
    await ctx.reply("🔢 Bloklamoqchi bo'lgan foydalanuvchining Telegram ID sini yuboring:");
  }


  @Hears("📄 Sertifikat olish")
  async handleCertificates(@Ctx() ctx: Context) {
    if (await this.newadminUtils.isUserBlocked(ctx)) return;
    try {
      return await this.registrationService.handleCertificates(ctx);
    } catch (err) {
      console.error(err);
      await ctx.reply("❌ Sertifikat olishda kutilmagan xatolik yuz berdi.");
    }
  }




  @Hears("🧪 Testni boshlash")
  async startTestHandler(@Ctx() ctx: Context) {
    console.log(ctx.message);
    
    if (await this.newadminUtils.isUserBlocked(ctx)) return;
    return this.registrationService.startTest(ctx);
  }

  

  @Hears("malumotlarim")
  async myInfo(@Ctx() ctx: Context) {
    if (await this.newadminUtils.isUserBlocked(ctx)) return;
    try {
      const bot_id = ctx.from!.id;
      const user = await this.prisma.user.findFirst({ where: { telegram_id: bot_id } });
      if (!user) {
        await ctx.reply("Siz hali ro'yxatdan o'tmadingiz.");
        return;
      }
      await ctx.reply(
        `👤 Siz haqingizdagi ma'lumotlar:\n\n 
        🙋 Ism: ${user.firstname || "Noma'lum"}\n 
        🙂 Yosh:${user.age || 25}\n
        🌤 Familiya: ${user.lastname || "Noma'lum"}\n 
        🌍 Viloyat: ${user.region || "Noma'lum"}\n
        📞 Telefon: ${user.contact || "Ko'rsatilmagan"}`,
        { parse_mode: 'Markdown' }
      );
    } catch (err) {
      console.error(err);
      await ctx.reply("❌ Ma'lumotlarni olishda xatolik yuz berdi.");
    }
  }

  @Hears("/bot_information")
  async botInfo(@Ctx() ctx: Context) {
    if (await this.newadminUtils.isUserBlocked(ctx)) return;
    try {
      const botInfo = await ctx.telegram.getMe();
      await ctx.replyWithMarkdown(
        `🤖 *Bot haqida ma'lumot:*\n\n` +
        `👤 *Nomi:* ${botInfo.first_name}\n` +
        `📄 *Username:* @${botInfo.username}\n` +
        `✅ *Botmi:* ${botInfo.is_bot ? 'Ha' : 'Yoq'}\n` +
        `👨‍💻 *Yaratgan odam:* *@Asqaraliyev_Faxriddin*`
      );
    } catch (err) {
      console.error(err);
      await ctx.reply("❌ Bot ma'lumotlarini olishda xatolik yuz berdi.");
    }
  }

  @Hears("/help")
  async helpCommand(@Ctx() ctx: Context) {
    if (await this.newadminUtils.isUserBlocked(ctx)) return;
    await ctx.reply(
      `🗂 <b>Yordam menyusi</b>\n\n` +
      `Quyidagi buyruqlar orqali botdan foydalanishingiz mumkin:\n\n` +
      `✅ <b>/start</b> - Ro'yxatdan o'tish\n` +
      `📘 <b>🧪 Testni boshlash</b> - Testni boshlash\n` +
      `📘 <b>malumotlarim</b> - malumotlaringiz\n` +
      `📄 <b>📄 Sertifikat olish</b> - Sertifikatni yuklab olish\n` +
      `🗑 <b>/delete</b> - Profilni o'chirish\n` +
      `<b>/help</b> - Yordam menyusi`,
      {
        parse_mode: 'HTML',
        reply_markup: { remove_keyboard: true }
      }
    );
  }

  @Start()
  async onStart(@Ctx() ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return ctx.reply("❗ Foydalanuvchi aniqlanmadi.");
  
    const text = ("text" in ctx.message!) ? ctx.message.text.trim() : "";
  
    if (this.awaitingAddAdmin.get(userId)) {
      this.awaitingAddAdmin.delete(userId);
  
      const telegramId = parseInt(text);
      if (isNaN(telegramId)) return ctx.reply("❗ Telegram ID faqat raqam bo'lishi kerak.");
  
      const user = await this.prisma.user.findUnique({ where: { telegram_id: telegramId } });
      if (!user) return ctx.reply("❌ Bunday foydalanuvchi topilmadi.");
      if (user.role === 'ADMIN' || user.role === 'SUPERADMIN') {
         ctx.reply("ℹ️ Bu foydalanuvchi allaqachon admin.");
         return
      }
  
      await this.prisma.user.update({
        where: { telegram_id: telegramId },
        data: { role: 'ADMIN' },
      });
  
       ctx.reply(`✅ Foydalanuvchi (${user.firstname}) endi admin.`);
       return
    }
  
    try {
      const member = await ctx.telegram.getChatMember('@Faxriddin_clever', userId);
      // @ts-ignore
      if (["left", "kicked"].includes(member.status)) {
         ctx.reply(
          "🚫 Botdan foydalanish uchun avval kanalga obuna boling:",
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "📢 Kanalga obuna bolish",
                    url: "https://t.me/Faxriddin_clever"
                  }
                ],
                [
                  {
                    text: "✅ A'zolikni tekshirish",
                    callback_data: "check_membership"
                  }
                ]
              ]
            }
          }
        );
        return
      }
    } catch (error) {
      console.error("Kanal tekshiruvida xatolik:", error);
       ctx.reply("❌ Kanalni tekshirib bolmadi. Keyinroq urinib koring.");
       return
    }
  
    // ✳️ BAZADAN USERNI QIDIRISH
    const user = await this.prisma.user.findFirst({ where: { telegram_id: BigInt(userId) } });
    if (user?.isActive === false) { ctx.reply("🚫 Siz bloklangansiz. Botdan foydalanish mumkin emas.")
       return } 
  
    if (user) {
      const role = user.role;
      const status = (await ctx.telegram.getChatMember('@Faxriddin_clever', userId)).status;
  
      if (role === 'SUPERADMIN' || role === 'ADMIN' || status === 'creator') {
         ctx.reply("👮‍♂️ Admin panelga xush kelibsiz!", {
          reply_markup: {
            keyboard: [
              ['📊 Statistika', '👥 Foydalanuvchilar'],
              ["➕ Admin qo'shish", '🚫 Bloklash'],
              ['✅ Test yuborish', '🏆 Sertifikatlar'],
              ['🧪 Testni boshlash',"🚫 Blokldan chiqarish"],
              ['/bot_information','malumotlarim'],
              ['/delete',"💖Admin o'chirish"],
              ['📄 Sertifikat olish','/help'],
              ['😎Search']
            ],
            resize_keyboard: true,
            one_time_keyboard: false,
            
          }
        
        });

        return
      } else {
         ctx.reply("👤 User panelga xush kelibsiz!", {
          reply_markup: {
            keyboard: [
              ['🧪 Testni boshlash','malumotlarim'],
              ['📄 Sertifikat olish','/help'],
              ['/bot_information']
            ],
            resize_keyboard: true,
            one_time_keyboard: false,
          }
        });
        return
      }
    }
  
    // FOYDALANUVCHI YOQ — YANGI ROYXAT BOSHLANADI
    UserState.set(userId, { step: "firstname", data: {} });
     ctx.reply("👋 Assalomu alaykum! Ismingizni kiriting:");
     return
  }
  
  

  @On('text')
async onText(@Ctx() ctx: Context) {
  const userId = ctx.from?.id;

  if (!userId || !('text' in ctx.message!)) {
    await ctx.reply("❗ Iltimos matn yuboring.");
    return;
  }

  const text = ctx.message.text.trim();

  if (!userId || !text) {
    await ctx.reply("❗ Iltimos matn yuboring.");
    return;
  }

  // ✅ 0. Admin qo‘shish uchun ID kutilyaptimi?
  if (this.awaitingAddAdmin.get(userId)) {
    if (!/^\d+$/.test(text)) {
      await ctx.reply("❗ Telegram ID faqat raqamlardan iborat bo'lishi kerak.");
      this.awaitingAddAdmin.delete(userId); 

      return;
    }

    const newAdminId = parseInt(text);
    let data = await this.prisma.user.findFirst({where:{telegram_id:newAdminId}})
    if (this.awaitingAddAdmin.get(userId)) {
    if(!data){
      ctx.reply("Bunday idli user topilmadi.\n Iltimos boshqattan sorov jonating")
      this.awaitingAddAdmin.delete(userId); 

      return
    }
  }
    try {
      this.awaitingAddAdmin.delete(userId);
      await ctx.reply(`✅ ${newAdminId} endi admin bo'ldi.`);
      this.awaitingAddAdmin.delete(userId); 

    } catch (error) {
      console.error(error);
      await ctx.reply("❌ Admin qo'shishda xatolik yuz berdi.");
    }
    return;
  }

  try {
    const member = await ctx.telegram.getChatMember('@Faxriddin_clever', userId);
    // @ts-ignore
    if (["left", "kicked"].includes(member.status)) {
      await ctx.reply("📛 Botdan foydalanish uchun avval @Faxriddin_clever kanaliga obuna boling.");
      return;
    }
  } catch (error) {
    console.error("Kanal tekshiruvida xatolik:", error);
    await ctx.reply("❌ Kanalni tekshirib bolmadi. Keyinroq urinib koring.");
    return;
  }

  const blockAction = this.awaitingBlock.get(userId);
  if (blockAction === "block" || blockAction === "unblock") {
    this.awaitingBlock.delete(userId);
    const telegramId = parseInt(text);
    if (isNaN(telegramId)) {
      await ctx.reply("❗ Telegram ID raqam bo'lishi kerak.")
      return;
    }

    if (blockAction === "block") {
      await this.newadminUtils.blockUserByTelegramId(ctx, telegramId);
    } else {
      await this.newadminUtils.unblockUserByTelegramId(ctx, telegramId);
    }
    return;
  }

  if (this.awaitingAdminDelete.get(userId)) {
    this.awaitingAdminDelete.delete(userId);
    if (text === "11201111") {
      this.tempDeleteTarget.set(userId, true);
      await ctx.reply("✅ Admin o'chirish ruxsati berildi. Kimni o'chirmoqchisiz? telegram_idni yuboring:");
    } else {
      await ctx.reply("❌ Noto'g'ri parol.");
    }
    return;
  }

  if (this.tempDeleteTarget.get(userId)) {
    this.tempDeleteTarget.delete(userId);
    const users = await this.prisma.user.findMany({
      where: { telegram_id: Number(text) },
    });

    if (users.length === 0) {
      await ctx.reply("🔍 Foydalanuvchi topilmadi.");
    } else if (users.length === 1) {
      await this.prisma.user.delete({ where: { id: users[0].id } });
      await ctx.reply(`✅ ${users[0].firstname} o'chirildi.`);
    } else {
      await ctx.reply("❗ Bir nechta foydalanuvchi topildi. Familiyasi bilan toliq yuboring.");
    }
    return;
  }

  if (this.awaitingSearch.get(userId)) {
    this.awaitingSearch.delete(userId);
    const users = await this.prisma.user.findMany({
      where: { firstname: { contains: text, mode: 'insensitive' } },
    });

    if (users.length === 0) {
      await ctx.reply("🔎 Foydalanuvchi topilmadi.");
    } else {
      for (const user of users) {
        await ctx.reply(
          `🆔 ID: ${user.telegram_id}\n` +
          `👤 Ism: ${user.firstname}\n` +
          `📍 Viloyat: ${user.region}\n` +
          `📞 Tel: ${user.contact || "yoq"}`
        );
      }
    }
    return;
  }

  const state = userTestStates.get(userId);
  if (state) {
    const currentQuestion = state.questions[state.index];
    const isCorrect = text.toUpperCase() === currentQuestion.Answer_Key;

    if (isCorrect) state.correct++;

    const existing = await this.prisma.answers.findFirst({
      where: { telegram_id: BigInt(userId) },
    });

    if (isCorrect) {
      if (existing) {
        await this.prisma.answers.update({
          where: { id: existing.id },
          data: { answer_count: existing.answer_count + 1 },
        });
      } else {
        await this.prisma.answers.create({
          data: { telegram_id: BigInt(userId), answer_count: 1 },
        });
      }
    }

    state.index++;

    if (state.index >= state.questions.length) {
      userTestStates.delete(userId);
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
    return;
  }

  const regState = UserState.get(userId);
  if (!regState) {
    await ctx.reply("❗ Iltimos /start buyrug'ini bosing.");
    return;
  }

  const isValidName = /^[A-Za-zА-Яа-яЁёЎўҒғҚқҲҳ\s'-]{2,}$/u;

  switch (regState.step) {
    case "firstname":
      if (!isValidName.test(text)) {
         ctx.reply("❗ Ism faqat harflardan iborat va kamida 2 ta harf bo'lishi kerak.");
         return
      }
      regState.data.firstname = text;
      regState.step = "lastname";
      await ctx.reply("🔤 Familiyangizni kiriting:");
      break;

    case "lastname":
      if (!isValidName.test(text)) {
         ctx.reply("❗ Familiya faqat harflardan iborat va kamida 2 ta harf bo'lishi kerak.");
         return
      }
      regState.data.lastname = text;
      regState.step = "region";
      await ctx.reply("📍 Viloyatingizni tanlang:", {
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
          one_time_keyboard: true,
        },
      });
      break;

    case "region":
      if (!isValidName.test(text)) {
         ctx.reply("❗ Viloyat nomi notogri. Faqat harflardan iborat bolishi kerak.");
         return
      }
      regState.data.region = text;
      regState.step = "age";
      await ctx.reply("🎂 Yoshingizni kiriting:");
      break;

    case "age":
      const age = parseInt(text);
      if (isNaN(age) || age < 10 || age > 100) {
         ctx.reply("❗ Iltimos, yoshingizni 10 dan 100 gacha bolgan raqamda yozing:");
         return
      }
      regState.data.age = age;
      regState.step = "contact";
      await ctx.reply("📞 Kontakt yuborishni bosing:", {
        reply_markup: {
          keyboard: [[{ text: "📲 Kontakt yuborish", request_contact: true }]],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      });
      break;

    default:
      await ctx.reply("❗ Noma'lum holat. Iltimos /start dan qayta boshlang.");
      UserState.delete(userId);
      break;
  }
}


  


  
  
  @On("contact")
  async onContact(@Ctx() ctx: Context) {
    try {
      const userId = ctx.from!.id;
      const state = UserState.get(userId);

      if (!state || state.step !== "contact") {
         await ctx.reply("/start ni bosing yoki ma'lumotlarni to'ldiring.");
         return
      }

      if (!ctx.message || !("contact" in ctx.message)) {
         await ctx.reply("Kontakt noto'g'ri yuborildi.");
         return
      }

      const contact = ctx.message.contact.phone_number;
      const oldUser = await this.prisma.user.findFirst({ where: { telegram_id: userId } });

      if (oldUser) {
         await ctx.reply("Siz allaqachon ro'yxatdan o'tgansiz. /delete ni bosing");
         return
      }

      await this.prisma.user.create({
        data: {
          telegram_id: userId,
          firstname: state.data.firstname || "Nomalum",
          lastname: state.data.lastname || "Nomalum",
          region: state.data.region || "Nomalum",
          age: state.data.age || 15,
          contact: contact,
        }
      });

      UserState.delete(userId);
      await ctx.reply(`\u2705 Ro'yxatdan o'tish muvaffaqiyatli yakunlandi.\nSertifikat olish uchun 📄 Sertifikat olish ni bosing`, keyboard.main);
      return
    } catch (err) {
      console.error(err);
      await ctx.reply("\u274C Kontaktni saqlashda xatolik yuz berdi.");
    }
  }
}





















