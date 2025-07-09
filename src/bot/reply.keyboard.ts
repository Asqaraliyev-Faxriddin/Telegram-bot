import { Markup } from 'telegraf'

export const keyboard = {
  main: Markup.keyboard([

    ["/start"],
    [ "/my_info", "/help"],
    ["/bot_information","/sertificate"],
    ["/delete"],



])
    .resize()
    .oneTime(false) 

}
