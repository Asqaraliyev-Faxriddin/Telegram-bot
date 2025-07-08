import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy,OnModuleInit {

    onModuleDestroy() {
        this.$disconnect()
    }

    onModuleInit() {
        this.$connect()
    }
}
