import { Module } from '@nestjs/common';
import { PostApprovalService } from './post-approval.service';
import { PostApprovalController } from './post-approval.controller';

@Module({ controllers: [PostApprovalController], providers: [PostApprovalService] })
export class PostApprovalModule { }
