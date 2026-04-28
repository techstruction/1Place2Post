import {
    Injectable,
    ConflictException,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
    ) { }

    async register(dto: RegisterDto) {
        const existing = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existing) throw new ConflictException('Email already in use');

        const passwordHash = await bcrypt.hash(dto.password, 12);
        const user = await this.prisma.user.create({
            data: { email: dto.email, passwordHash, name: dto.name },
        });

        return this.signToken(user.id, user.email, user.role, user.onboardingCompletedAt);
    }

    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (!user) throw new UnauthorizedException('Invalid credentials');
        if (!user.passwordHash) throw new UnauthorizedException('Please login with Google.');

        const valid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!valid) throw new UnauthorizedException('Invalid credentials');

        return this.signToken(user.id, user.email, user.role, user.onboardingCompletedAt);
    }

    async validateOAuthUser(email: string, name?: string, avatarUrl?: string) {
        let user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            user = await this.prisma.user.create({
                data: { email, name, avatarUrl, passwordHash: null },
            });
        } else if (!user.avatarUrl && avatarUrl) {
            user = await this.prisma.user.update({ where: { id: user.id }, data: { avatarUrl } });
        }
        return this.signToken(user.id, user.email, user.role, user.onboardingCompletedAt);
    }

    private signToken(userId: string, email: string, role?: string, onboardingCompletedAt?: Date | null) {
        const payload = { sub: userId, email, role: role || 'USER' };
        return {
            access_token: this.jwt.sign(payload),
            needsOnboarding: !onboardingCompletedAt,
            user: { id: userId, email, role: role || 'USER' },
        };
    }
}
