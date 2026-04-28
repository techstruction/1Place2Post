import { Module } from '@nestjs/common';
import { ThreadsController } from './threads.controller';
import { ThreadsService } from './threads.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [ConfigModule, PrismaModule],
    controllers: [ThreadsController],
    providers: [ThreadsService],
})
export class ThreadsModule {}
