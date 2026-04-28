import { Module } from '@nestjs/common';
import { YoutubeController } from './youtube.controller';
import { YoutubeService } from './youtube.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [ConfigModule, PrismaModule],
    controllers: [YoutubeController],
    providers: [YoutubeService],
})
export class YoutubeModule {}
