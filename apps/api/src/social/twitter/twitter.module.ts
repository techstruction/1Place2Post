import { Module } from '@nestjs/common';
import { TwitterController } from './twitter.controller';
import { TwitterService } from './twitter.service';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [ConfigModule],
    controllers: [TwitterController],
    providers: [TwitterService],
    exports: [TwitterService],
})
export class TwitterModule { }
