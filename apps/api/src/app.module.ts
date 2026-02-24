import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PostModule } from './post/post.module';
import { SocialAccountModule } from './social-account/social-account.module';
import { SeriesModule } from './series/series.module';
import { LinkPageModule } from './link-page/link-page.module';
import { BotRuleModule } from './bot-rule/bot-rule.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UserModule,
    PostModule,
    SocialAccountModule,
    SeriesModule,
    LinkPageModule,
    BotRuleModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule { }
