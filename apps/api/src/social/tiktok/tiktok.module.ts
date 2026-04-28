import { Module } from '@nestjs/common';
import { TiktokController } from './tiktok.controller';
import { TiktokService } from './tiktok.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [ConfigModule, PrismaModule],
    controllers: [TiktokController],
    providers: [TiktokService],
})
export class TiktokModule {}
