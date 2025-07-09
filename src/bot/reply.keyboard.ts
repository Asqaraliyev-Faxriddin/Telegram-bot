import { Markup } from 'telegraf'

export const keyboard = {
  main: Markup.keyboard([

    ["/start"],
    [ "my_info", "help"],
    ["delete"],
    ["bot_information"]

])
    .resize()
    .oneTime(false) 

}
