import { Module } from '@nestjs/common';
import { SocialAccountService } from './social-account.service';
import { SocialAccountController } from './social-account.controller';
import { TokenHealthModule } from '../token-health/token-health.module';

@Module({
    imports: [TokenHealthModule],
    controllers: [SocialAccountController],
    providers: [SocialAccountService],
    exports: [SocialAccountService],
})
export class SocialAccountModule { }
