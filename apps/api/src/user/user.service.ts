import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) { }

    findByEmail(email: string) {
        return this.prisma.user.findUnique({ where: { email } });
    }

    findById(id: string) {
        return this.prisma.user.findUnique({
            where: { id },
            select: { id: true, email: true, name: true, role: true, createdAt: true },
        });
    }

    async getMe(userId: string) {
        return this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true, email: true, name: true, avatarUrl: true, role: true,
                userRole: true, onboardingCompletedAt: true, createdAt: true,
            },
        });
    }

    async updateProfile(userId: string, data: { name?: string; userRole?: string; onboardingCompletedAt?: Date | null }) {
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.userRole !== undefined && { userRole: data.userRole as any }),
                ...(data.onboardingCompletedAt !== undefined && { onboardingCompletedAt: data.onboardingCompletedAt }),
            },
            select: {
                id: true, email: true, name: true, userRole: true, onboardingCompletedAt: true,
            },
        });
    }
}
