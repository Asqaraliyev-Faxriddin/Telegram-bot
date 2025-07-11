// src/modules/bot/utils/admin.functions.ts
import { Context } from 'telegraf';
import { PrismaService } from 'src/core/prisma/prisma.service';

export class AdminUtils {
  constructor(private prisma: PrismaService) {}

  async isUserBlocked(ctx: Context): Promise<boolean> {
    const userId = ctx.from?.id;
    if (!userId) {
      await ctx.reply("❗ Foydalanuvchi aniqlanmadi.");
      return true; // bloklangandek tutamiz
    }
  
    const user = await this.prisma.user.findUnique({ where: { telegram_id: userId } });
  
    if (!user) {
      await ctx.reply("❗ Siz ro'yxatdan o'tmagansiz.");
      return true;
    }
  
    if (user.isActive === false) {
      await ctx.reply('🚫 Siz bloklangansiz. Admin bilan bog‘laning.');
      return true;
    }
  
    return false; // bloklanmagan
  }
  
async isSuperAdmin(userId: number): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { telegram_id: userId } });
    return user?.role === 'SUPERADMIN';
  }

async isAdmin(userId: number,ctx:Context): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { telegram_id: userId } });
    const status = (await ctx.telegram.getChatMember("@Faxriddin_clever",userId)).status
 
    return user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' || status ==="creator";
  }

async restrictToAdminsOnly(ctx: Context): Promise<boolean> {
    const userId = ctx.from?.id;
    if (!userId || !(await this.isAdmin(userId,ctx))) {
      await ctx.reply('❌ Sizda bu amal uchun vakolat yo‘q.');
      return false;
    }
    return true;
  }

async restrictToSuperAdminOnly(ctx: Context): Promise<boolean> {
    const userId = ctx.from?.id;
    if (!userId || !(await this.isSuperAdmin(userId))) {
      await ctx.reply('❌ Bu amal faqat SUPERADMIN uchun.');
      return false;
    }
    return true;
  }

async checkIfCreatorInGroup(ctx: Context, groupUsername = '@Faxriddin_clever'): Promise<boolean> {
    try {
      const chatMember = await ctx.telegram.getChatMember(groupUsername, ctx.from!.id);
      return chatMember.status === 'creator';
    } catch (err) {
      console.error('Guruhni tekshirishda xatolik:', err);
      return false;
    }
  }


  async blockUserByTelegramId(ctx: Context, telegramId: number): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { telegram_id: telegramId } });
  
    if (!user) {
      await ctx.reply("❗ Bu telegram ID bo'yicha foydalanuvchi topilmadi.");
      return;
    }
  
    if (!user.isActive) {
      await ctx.reply("Bu foydalanuvchi allaqachon bloklangan.");
      return;
    }
  
    await this.prisma.user.update({
      where: { telegram_id: telegramId },
      data: { isActive: false },
    });
  
    await ctx.reply(`✅ ${user.firstname} bloklandi.`); 
    await ctx.reply(`✅ ID: ${user.telegram_id} bloklandi.`);
  }


  async unblockUserByTelegramId(ctx: Context, telegramId: number): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { telegram_id: telegramId } });
  
    if (!user) {
      await ctx.reply("❗ Bu telegram ID bo'yicha foydalanuvchi topilmadi.");
      return;
    }
  
    if (user.isActive) {
      await ctx.reply("Bu foydalanuvchi allaqachon aktiv.");
      return;
    }
  
    await this.prisma.user.update({
      where: { telegram_id: telegramId },
      data: { isActive: true },
    });
  
    await ctx.reply(`✅ @${user.firstname} blokdan chiqarildi.`);
  }
  
}
