import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TokenHealthService } from './token-health.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, NotificationModule],
  providers: [TokenHealthService],
  exports: [TokenHealthService],
})
export class TokenHealthModule {}
