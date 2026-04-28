import { IsString, IsOptional, IsEmail, IsIn } from 'class-validator';

export class CreateWorkspaceDto {
  @IsString() name: string;
  @IsOptional() @IsString() industry?: string;
}

export class InviteMemberDto {
  @IsEmail() email: string;
  @IsOptional() @IsIn(['ADMIN', 'SUPERVISOR', 'MEMBER']) role?: string;
}

export class UpdateMemberRoleDto {
  @IsIn(['ADMIN', 'SUPERVISOR', 'MEMBER']) role: string;
}
