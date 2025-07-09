import { Action, Hears, Ctx, On, Start, Update } from "nestjs-telegraf"
import { UserState } from "src/common/user.state"
import { PrismaService } from "src/core/prisma/prisma.service"
import { Context } from "telegraf"
import { keyboard } from "./reply.keyboard"




@Update()
export class UpdateBot {
    constructor(private readonly prisma: PrismaService) {}


    @Hears('/help')
    async help(@Ctx() ctx: Context) {
      return ctx.reply(
 `Yordam:  
  /start - Botni ishga tushirish
  🆘 Yordam - Yordam
  Ma'lumotlarim - Profil malumotlaringiz
  📋 Bot Haqida - Bot haqida,
  `
      )
    }
  
    @Hears("/my_info")
    async info(@Ctx() ctx: Context) {
      const oldId = ctx.from!.id
      let user = await this.prisma.user.findFirst({where:{telegram_id:oldId}})
      if(!user) return ctx.reply("Siz hali o'yxatdan o'tmagansiz");
    
      throw ctx.reply(` 👤 Siz haqingizda malumot:\n
  🧑 Ism: ${user?.firstname || "😀"} 
  🔤 Familiya: @${user?.lastname || 'Nomalum'}
  🆔 Yosh: ${user?.age || "🔞"} 
  ☎️ Telefon: ${user?.contact || "📞"}
  `)
      
    }
  
    @Hears('bot_information')
    async botInfo(@Ctx() ctx: Context) {
      return ctx.reply(`🤖 Bu bot @Faxriddin_clever tomonidan ishlab chiqilgan.
  U foydalanuvchilardan ro'yxatdan o'tishini, kanalga azo bo'lishini va boshqa xizmatlarni amalga oshiradi.`)
    }




    @Action("check_subscription")
    async check_subcription(@Ctx() ctx:Context){
    
        let userId = ctx.from!.id
        let chatId = -1002184621857
    
        try {
        
          
          let res = await ctx.telegram.getChatMember(chatId,userId)
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


    @Hears("/delete")
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
    
      
      let res = await ctx.telegram.getChatMember(chatId,userId)
      let status = res.status
        console.log(res);
        
      if (status === 'left') {
        ctx.reply("Xush kelibsiz!", keyboard.main)
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
        return ctx.reply("✅ Siz allaqachon ro'yxatdan o'tgansiz!\nAgar o'chirmoqchi bo'lsangiz: /delete/user")
      }

      if (ctx.callbackQuery) {
        await ctx.answerCbQuery();
      }
      UserState.set(userId, { step: "firstname", data: {} })
      ctx.reply("Xush kelibsiz!", keyboard.main)
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
            if(olduser) throw ctx.reply(`Siz oldin ro'yxatdan o'tgansiz!!!\n o'zingizni o'chirishingiz mumkin bosing: /delete`)
           

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
        ctx.reply("✅✅ Ma'lumotlaringiz saqlandi.",keyboard.main)
    }
}


