import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: 'hashed_password',
    name: 'Test User',
    role: 'USER',
    createdAt: new Date(),
    updatedAt: new Date(),
};

const mockPrisma = {
    user: {
        findUnique: jest.fn(),
        create: jest.fn(),
    },
};

const mockJwt = {
    sign: jest.fn().mockReturnValue('mock.jwt.token'),
};

describe('AuthService', () => {
    let service: AuthService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: JwtService, useValue: mockJwt },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        jest.clearAllMocks();
    });

    // ── register ──────────────────────────────────────────────────────────────
    describe('register', () => {
        it('creates a new user and returns a token', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);
            mockPrisma.user.create.mockResolvedValue(mockUser);

            const result = await service.register({
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User',
            });

            expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
            expect(result.access_token).toBe('mock.jwt.token');
            expect(result.user.email).toBe('test@example.com');
        });

        it('throws ConflictException when email already exists', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);

            await expect(
                service.register({ email: 'test@example.com', password: 'password123' }),
            ).rejects.toThrow(ConflictException);

            expect(mockPrisma.user.create).not.toHaveBeenCalled();
        });

        it('hashes the password before saving', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);
            mockPrisma.user.create.mockResolvedValue(mockUser);

            await service.register({ email: 'new@example.com', password: 'secret123' });

            const createCall = mockPrisma.user.create.mock.calls[0][0];
            const plainPassword = 'secret123';
            const storedHash = createCall.data.passwordHash;
            const matches = await bcrypt.compare(plainPassword, storedHash);

            expect(matches).toBe(true);
        });
    });

    // ── login ─────────────────────────────────────────────────────────────────
    describe('login', () => {
        it('returns a token for valid credentials', async () => {
            const hash = await bcrypt.hash('correctpassword', 12);
            mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, passwordHash: hash });

            const result = await service.login({
                email: 'test@example.com',
                password: 'correctpassword',
            });

            expect(result.access_token).toBe('mock.jwt.token');
        });

        it('throws UnauthorizedException for unknown email', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);

            await expect(
                service.login({ email: 'nobody@example.com', password: 'anything' }),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('throws UnauthorizedException for wrong password', async () => {
            const hash = await bcrypt.hash('correctpassword', 12);
            mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, passwordHash: hash });

            await expect(
                service.login({ email: 'test@example.com', password: 'wrongpassword' }),
            ).rejects.toThrow(UnauthorizedException);
        });
    });
});
