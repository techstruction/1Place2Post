import { Module } from '@nestjs/common';
import { LinkPageService } from './link-page.service';
import { LinkPageController, PublicLinkPageController } from './link-page.controller';

@Module({
    controllers: [LinkPageController, PublicLinkPageController],
    providers: [LinkPageService],
    exports: [LinkPageService],
})
export class LinkPageModule { }
