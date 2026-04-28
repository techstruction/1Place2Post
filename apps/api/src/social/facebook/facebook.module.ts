import { Module } from '@nestjs/common';
import { FacebookController } from './facebook.controller';
import { FacebookService } from './facebook.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [ConfigModule, PrismaModule],
    controllers: [FacebookController],
    providers: [FacebookService],
})
export class FacebookModule {}
