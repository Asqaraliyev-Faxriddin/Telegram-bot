import { Module } from '@nestjs/common';
import * as dotenv from "dotenv"
dotenv.config()
import { TelegrafModule } from 'nestjs-telegraf';
import { UpdateBot } from './bot.update';

@Module({

    imports:[TelegrafModule.forRoot({
        token:process.env.Bot_Token as string
    })],
    providers:[UpdateBot]

})



export class BotModule {} 
