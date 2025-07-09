import { Action, Command, Ctx, Hears, On, Start, Update } from "nestjs-telegraf"
import { reduce } from "rxjs"
import { UserState } from "src/common/user.state"
import { PrismaService } from "src/core/prisma/prisma.service"
import { Context, Telegraf } from "telegraf"



let bot = new Telegraf(process.env.Bot_Token as string)

@Update()
export class UpdateBot {
    constructor(private readonly prisma: PrismaService) {}


    @Command('help')
    async help(@Ctx() ctx: Context) {
      return ctx.reply(
 `Yordam:  
  /start - Botni ishga tushirish
  /help - Yordam
  /info - Profil malumotlaringiz
  /bot_info - Bot haqida,
  `
      )
    }
  
    @Command('info')
    async info(@Ctx() ctx: Context) {
      const user = ctx.from!
      throw ctx.reply(`👤 Siz haqingizda malumot:
  🧑 Ism: ${user.first_name}
  🔤 Username: @${user.username || 'yoq'}
  🆔 Telegram ID: ${user.id}`)
    }
  
    @Command('bot_info')
    async botInfo(@Ctx() ctx: Context) {
      return ctx.reply(`🤖 Bu bot @Faxriddin_clever tomonidan ishlab chiqilgan.
  U foydalanuvchilardan ro'yxatdan o'tishini, kanalga azo bo'lishini va boshqa xizmatlarni amalga oshiradi.`)
    }







    // @Hears(/^\/(?!start|delete\/user).*$/)
    // async invalidCommand(@Ctx() ctx: Context) {
  
    //     throw ctx.reply(`❌ Noma'lum buyruq! Faqat /start yoki /delete/user ni ishlating.`)
    // }
    


    @Action("check_subscription")
    async check_subcription(@Ctx() ctx:Context){
    
        let userId = ctx.from!.id
        let chatId = -1002184621857
    
        try {
        
          
          let res = await bot.telegram.getChatMember(chatId,userId)
          let status = res.status
            console.log(res);
            
          if (status === 'left') {
            throw ctx.reply(
              `👋 Iltimos, quyidagi kanalga obuna bo'ling va "✅ Tekshirish" tugmasini bosing:\n\n` +
              `📢 @${'@Faxriddin_clever'}`,
              {
                reply_markup: {
                  inline_keyboard: [
                    [{ text: '➕ Kanal', url: `https://t.me/Faxriddin_clever` }],
                    [{ text: '✅ Tekshirish', callback_data: 'check_subscription' }],
                  ],
                },
              }
            );
      
          }
    
          let oldUser = await this.prisma.user.findFirst({
            where: { telegram_id:userId
    
        }})
    
          if (oldUser) {
            throw ctx.reply("✅ Siz allaqachon ro'yxatdan o'tgansiz!\nAgar o'chirmoqchi bo'lsangiz: /delete/user")
          }
    
          UserState.set(userId, { step: "firstname", data: {} })
          ctx.reply("Ismingizni kiriting:")
        } catch (err) {
          console.error(err)
        }
      

    }






    @Hears("/delete/user")
    async deleteUser(@Ctx() ctx:Context){
    let data = await this.prisma.user.findFirst({where:{telegram_id:ctx.from!.id}})
    if(!data) throw ctx.reply(`Siz hali ro'yxatdan o'tmagansiz !!!\n /start buyrug'ini kiriting`)
     await this.prisma.user.delete({where:{telegram_id:ctx.from!.id}})
    
        UserState.delete(ctx.from!.id)

        throw ctx.reply("Siz o'chirildingiz boshqattan\nro'yxatdan o'tishingiz mumkin.😀😀")

}


    


@Start()
  async start(@Ctx() ctx: Context) {
    let userId = ctx.from!.id
    let chatId = -1002184621857

    try {
    
      
      let res = await bot.telegram.getChatMember(chatId,userId)
      let status = res.status
        console.log(res);
        
      if (status === 'left') {
        throw ctx.reply(
          `👋 Iltimos, quyidagi kanalga obuna bo'ling va "✅ Tekshirish" tugmasini bosing:\n\n` +
          `📢 @${'@Faxriddin_clever'}`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: '➕ Kanal', url: `https://t.me/Faxriddin_clever` }],
                [{ text: '✅ Tekshirish', callback_data: 'check_subscription' }],
              ],
            },
          }
        );
  
      }

      let oldUser = await this.prisma.user.findFirst({
        where: { telegram_id:userId

    }})

      if (oldUser) {
        throw ctx.reply("✅ Siz allaqachon ro'yxatdan o'tgansiz!\nAgar o'chirmoqchi bo'lsangiz: /delete/user")
      }

      await ctx.answerCbQuery()
      UserState.set(userId, { step: "firstname", data: {} })
      ctx.reply("Ismingizni kiriting:")
    } catch (err) {
      console.error(err)
    }
  }

    @On("text")
    async OnText(@Ctx() ctx: Context) {
        let userId = ctx.from!.id
        let state = UserState.get(userId)

        console.log( ctx.message);
        

        if (!state) throw ctx.reply("/start ni bosing")

            if (!ctx.message || !('text' in ctx.message)){
                return ctx.reply("Faqat matn yuboring.")
            }
            let text = ctx.message.text
           

        switch (state.step) {
            case "firstname":
            
            state.data.firstname = text
                state.step = "lastname"
                ctx.reply("Familiyangizni kiriting:")
                break

            case "lastname":
                
            state.data.lastname = text
                state.step = "age"
                ctx.reply("Yoshingizni kiriting:")
                break

                case "age":
                let age = parseInt(text)
               
                if (isNaN(age)) throw ctx.reply("Yoshingizni raqam bilan kiriting:")
               
                state.data.age = age
                state.step = "contact"
               
                ctx.reply("Iltimos kontakt yuboring (raqam yuborish tugmasidan foydalaning)", {
                    reply_markup: {
                        keyboard: [
                            [{ text: "Kontakt yuborish", request_contact: true }]
                        ],
                        resize_keyboard: true,
                        one_time_keyboard: true
                    }
                })
                break

            default:
                ctx.reply("Iltimos kontakt yuboring.")
                break
        }
    }

    @On("contact")
    async OnContact(@Ctx() ctx: Context) {
        let userId = ctx.from!.id
        let state = UserState.get(userId)

        if (!state) return ctx.reply("/start ni bosing")
        if (state.step !== "contact") return ctx.reply("Kontakt yuborishdan oldin ma'lumotlarni to'ldiring.")

            let contact = "sddsds"

            if (ctx.message && 'contact' in ctx.message) {
                contact =ctx.message.contact.phone_number
            } else{
                throw ctx.reply("Boshqattan ro'yxatdan o'ting. /start")
            }
            let olduser = await this.prisma.user.findFirst({where:{telegram_id:ctx.from!.id}})
            if(olduser) throw ctx.reply(`Siz oldin ro'yxatdan o'tgansiz!!!\n o'zingizni o'chirishingiz mumkin bosing: /delete/user`)
           

        await this.prisma.user.create({
            data: {
                telegram_id:userId,
                firstname: state.data.firstname!,
                lastname: state.data.lastname!,
                age: state.data.age!,
                contact: contact!
            }
        })

        
        UserState.delete(userId)
        ctx.reply("✅✅ Ma'lumotlaringiz saqlandi.")
    }
}


