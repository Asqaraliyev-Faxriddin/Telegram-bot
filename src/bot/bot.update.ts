import { Action, Hears, Ctx, On, Start, Update, Command } from "nestjs-telegraf"
import { UserState } from "src/common/user.state"
import { PrismaService } from "src/core/prisma/prisma.service"
import { Context } from "telegraf"
import { keyboard } from "./reply.keyboard"
import * as path from "path"
import { addTextToImage } from "certificates/sertificat"



@Update()
export class UpdateBot {
    constructor(private readonly prisma: PrismaService) {}


    @Hears('/help')
    async help(@Ctx() ctx: Context) {
      throw ctx.reply(
 `Yordam:  
  
💬 Bot Komandalari va Tushuntirishlari:

/start  Siz bu orqali ro'yxatdan o'tasiz.
/my_info  Siz haqingizdagi ma'lumotlarni ko'rsatadi.
/help  Botdan qanday foydalanish kerakligi haqida yordam beradi.
/bot_information  Bot haqida umumiy ma'lumotlar beradi.
/sertificate  Shaxsiy sertifikatingizni olasiz .
/delete  Botdan o'z ma'lumotlaringizni o'chiradi.
  `
          )
    }


    @Hears("/delete")
    async deleteUser(@Ctx() ctx:Context){
    let data = await this.prisma.user.findFirst({where:{telegram_id:ctx.from!.id}})
    if(!data) throw ctx.reply(`Siz hali ro'yxatdan o'tmagansiz !!!\n /start buyrug'ini kiriting`)
     await this.prisma.user.delete({where:{telegram_id:ctx.from!.id}})
    
        UserState.delete(ctx.from!.id)

        throw ctx.reply(`Siz o'chirildingiz boshqattan\nro'yxatdan o'tishingiz mumkin.😀😀\n/start ni bosing`)

}
  
    @Hears("/my_info")
    async info(@Ctx() ctx: Context) {
      const oldId = ctx.from!.id
      let user = await this.prisma.user.findFirst({where:{telegram_id:oldId}})
      if(!user) throw ctx.reply("Siz hali o'yxatdan o'tmagansiz");
    
      throw ctx.reply(`  
    👤 Siz haqingizda malumot:\n
  🧑 Ism: ${user?.firstname || "😀"} 
  🔤 Familiya: ${user?.lastname || 'Nomalum'}
  🆔 Yosh: ${user?.age || "🔞"} 
  ☎️ Telefon: ${user?.contact || "📞"}
  `)
      
    }
  
    @Hears('/bot_information')
    async botInfo(@Ctx() ctx: Context) {
      throw ctx.reply(` 🤖 Bu bot @Faxriddin_clever tomonidan ishlab chiqilgan.\n U foydalanuvchilardan ro'yxatdan o'tishini,\n kanalga azo bo'lishini va boshqa\n xizmatlarni amalga oshiradi.`)
    }



    @Hears('/sertificate')
  async sendCertificate(@Ctx() ctx: Context) {
    

    const oldId = ctx.from!.id
    let user = await this.prisma.user.findFirst({where:{telegram_id:oldId}})

    if(!user) throw ctx.reply("Siz hali o'yxatdan o'tmagansiz")
      const now = new Date();
    const lastTime = user.sertificatian_Date
    const twoHoursInMs = 2 * 60 * 60 * 1000;
      if (user.sertificat_count >= 3 && now.getTime() - new Date(lastTime).getTime() < twoHoursInMs) {
        throw ctx.reply("❌ Siz 3 marta urindingiz. Iltimos, 2 soatdan keyin qayta urinib ko'ring. 😎");
      }
    
      if (user.sertificat_count >= 3 && now.getTime() - new Date(lastTime).getTime() >= twoHoursInMs) {
        user.sertificat_count = 0;
      }

    

    await addTextToImage(user.firstname,user.lastname)


  const filePath = path.join(process.cwd(), 'templates', 'top.jpeg');
 

  let oldCount = user.sertificat_count +=1
   let oldDate = user.sertificatian_Date = new Date()

  await this.prisma.user.update({where:{telegram_id:ctx.from!.id},data:{sertificat_count:oldCount,sertificatian_Date:oldDate}})

  await ctx.replyWithPhoto({ source: filePath }, { caption: '📄 Sertifikatingiz tayyor!' });
  }


    @Action("check_subscription")
    async check_subcription(@Ctx() ctx:Context){
      await ctx.answerCbQuery();
        let userId = ctx.from!.id
        let chatId = -1002184621857
    
        try {
        
          
          let res = await ctx.telegram.getChatMember(chatId,userId)
          let status = res.status
            console.log(res);
            
          if (status === 'left') {
            throw  ctx.reply(
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





@Start()
    async start(@Ctx() ctx: Context) {
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
          throw ctx.reply(`✅ Siz allaqachon ro'yxatdan o'tgansiz!\nAgar boshqattan ro'yxatdan o'tmoqchi bo'lsangiz\no'zingizni o'chirishingiz kerak bo'ladi\nbuning uchun esa shuni bosing: /delete`)
        }
        if (ctx.callbackQuery) {
          await ctx.answerCbQuery();
        }
       

        UserState.set(userId, { step: "firstname", data: {} })
    
        ctx.reply(`Ro'yxatdan o'tmoqdasiz:\n\nIsmingizni kiriting:`)

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
                throw ctx.reply("Faqat matn yuboring.")
            }
            let text = ctx.message.text
           

        switch (state.step) {
            case "firstname":
            
            state.data.firstname = text
                state.step = "region"
                ctx.reply("Familiyangizni kiriting:")
                break

                case "region":
                  state.data.region = text
                  state.step = "lastname"
                  ctx.reply("Viloyatingizni tanlang:",{
                    
                    reply_markup:{
                     keyboard: [
                      ["Toshkent", "Samarqand"],
                      ["Farg'ona", "Andijon"],
                      ["Surxondaryo", "Jizzax"],
                      ["Buxoro", "Namangan"],
                      ["Xorazm", "Sirdaryo"],
                      ["Qashqadaryo", "Navoiy"],
                      ["Qoraqalpog'iston"]
              
                     ]
              
                    }
              
                
                  })
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
                firstname:state.data.firstname!,
                lastname:state.data.region!,
                age: state.data.age!,
                region: state.data.lastname!,
                contact: contact!
            }
        })

        
        UserState.delete(userId)
        ctx.reply(`✅✅ Ma'lumotlaringiz saqlandi.
 sertificat olish uchun /sertificate ni bosing
          
          
          
          `,keyboard.main)
    }
}


