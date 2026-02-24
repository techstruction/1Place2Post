import { Module } from '@nestjs/common';
import { RssCampaignService } from './rss-campaign.service';
import { RssCampaignController } from './rss-campaign.controller';

@Module({ controllers: [RssCampaignController], providers: [RssCampaignService] })
export class RssCampaignModule { }
