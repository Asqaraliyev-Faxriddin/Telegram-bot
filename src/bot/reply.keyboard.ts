import { Markup } from 'telegraf'

export const keyboard = {
  main: Markup.keyboard([

    ["/start","✅ Test yuborish"],
    [ "/my_info", "Yordam"],
    ["/bot_information","📄 Sertifikat olish"],
    ["/delete"],



])
    .resize()
    .oneTime(false) 

}
