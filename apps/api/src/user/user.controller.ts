import { Controller, Get, Patch, Body, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsOptional, IsString } from 'class-validator';

class UpdateProfileDto {
    @IsOptional() @IsString() name?: string;
    @IsOptional() @IsString() userRole?: string;
    @IsOptional() onboardingCompletedAt?: Date | null;
}

@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get('me')
    getMe(@Req() req: any) {
        return this.userService.getMe(req.user.id);
    }

    @Patch('me')
    updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
        return this.userService.updateProfile(req.user.id, dto);
    }
}
