import { Module } from '@nestjs/common';
import * as dotenv from "dotenv"
dotenv.config()
import { TelegrafModule } from 'nestjs-telegraf';
import { UpdateBot } from './bot.update';
import { RegistrationModule } from './registration/registration.module';
import { BotService } from './bot.service';

@Module({

    imports:[TelegrafModule.forRoot({
        token:process.env.Bot_Token as string
    }), RegistrationModule],
    providers:[UpdateBot,BotService]

})



export class BotModule {} 
