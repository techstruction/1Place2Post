import { IsString, IsEmail } from 'class-validator';

export class CreateTeamDto {
    @IsString() name: string;
}

export class InviteMemberDto {
    @IsEmail() email: string;
}
