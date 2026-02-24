import { Module } from '@nestjs/common';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({ imports: [NotificationModule], controllers: [SupportController], providers: [SupportService] })
export class SupportModule { }
