import { Controller, Get, OnModuleInit } from "@nestjs/common";
import { InjectBot } from "nestjs-telegraf";
import { Telegraf } from "telegraf";

export class BotService implements OnModuleInit {
    constructor(@InjectBot() private bot:Telegraf<any>){}




    onModuleInit() {
        this.bot.telegram.setMyCommands([
            {
                command:"start",description:"Botni qayta ishga tushurish",
                

            },
            {
                command:"help",description:"Yordam so'rash",

                
            },

            {
                command:"delete",description:"O'zingizni o'chirasiz"

            },
            {
                command:"bot_information",description:"Bot haqida malumot olish"

            },

            {
                command:"my_info",description:"o'zingizni shahsiy malumotlaringizni olasiz"

            },

       
            

        ])
    }
}

// JIMP