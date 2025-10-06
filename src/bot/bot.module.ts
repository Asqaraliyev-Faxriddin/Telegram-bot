import { Module } from '@nestjs/common';
import * as dotenv from "dotenv"
dotenv.config()
import { TelegrafModule } from 'nestjs-telegraf';
import { UpdateBot } from './bot.update';
import { RegistrationModule } from './registration/registration.module';
import { BotService } from './bot.service';
import { AdminUtils } from './bot.actions';

@Module({

    imports:[TelegrafModule.forRoot({
        token:process.env.TELEGRAM_BOT_TOKEN as string
    }), RegistrationModule],
    providers:[UpdateBot,BotService,AdminUtils]

})



export class BotModule {} 
