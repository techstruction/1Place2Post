import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
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
import { MediaModule } from './media/media.module';
import { TemplateModule } from './template/template.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { TeamModule } from './team/team.module';
import { PostApprovalModule } from './post-approval/post-approval.module';
import { RssCampaignModule } from './rss-campaign/rss-campaign.module';
import { OutgoingWebhookModule } from './outgoing-webhook/outgoing-webhook.module';
import { AiModule } from './ai/ai.module';
import { NotificationModule } from './notification/notification.module';
import { PublishQueueModule } from './publish-queue/publish-queue.module';
import { SupportModule } from './support/support.module';
import { InboxModule } from './inbox/inbox.module';
import { LeadModule } from './lead/lead.module';
import { AdminModule } from './admin/admin.module';
import { InstagramModule } from './social/instagram/instagram.module';
import { TwitterModule } from './social/twitter/twitter.module';
import { LinkedinModule } from './social/linkedin/linkedin.module';
import { McpModule } from './mcp/mcp.module';
import { TokenHealthModule } from './token-health/token-health.module';
import { RateLimitModule } from './rate-limit/rate-limit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // TODO: S3 migration — remove ServeStaticModule and replace with signed cloud URLs after MVP.
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    PostModule,
    SocialAccountModule,
    SeriesModule,
    LinkPageModule,
    BotRuleModule,
    MediaModule,
    TemplateModule,
    AnalyticsModule,
    TeamModule,
    PostApprovalModule,
    RssCampaignModule,
    OutgoingWebhookModule,
    AiModule,
    NotificationModule,
    PublishQueueModule,
    SupportModule,
    InboxModule,
    LeadModule,
    AdminModule,
    InstagramModule,
    TwitterModule,
    LinkedinModule,
    McpModule,
    TokenHealthModule,
    RateLimitModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule { }
