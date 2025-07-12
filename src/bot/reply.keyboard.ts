import { Markup } from 'telegraf'

export const keyboard = {
  main: Markup.keyboard([

    ["/start","✅ Test yuborish",],
    [ "malumotlarim", "/help"],
    ["/bot_information","📄 Sertifikat olish"],
    ["/delete",'🧪 Testni boshlash'],



])
    .resize()
    .oneTime(false) 

}
