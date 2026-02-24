import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';

const USER_ID = 'user-1';
const now = new Date();
const yesterday = new Date(now.getTime() - 86400000);

const mockEvents = [
    { id: '1', userId: USER_ID, platform: 'INSTAGRAM', metric: 'LIKES', value: 100, occurredAt: now },
    { id: '2', userId: USER_ID, platform: 'INSTAGRAM', metric: 'VIEWS', value: 500, occurredAt: now },
    { id: '3', userId: USER_ID, platform: 'TIKTOK', metric: 'LIKES', value: 200, occurredAt: yesterday },
];

const mockPrisma = {
    engagementEvent: {
        create: jest.fn(),
        findMany: jest.fn(),
    },
};

describe('AnalyticsService', () => {
    let service: AnalyticsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [AnalyticsService, { provide: PrismaService, useValue: mockPrisma }],
        }).compile();
        service = module.get<AnalyticsService>(AnalyticsService);
        jest.clearAllMocks();
    });

    describe('summary', () => {
        it('returns correct totals per metric', async () => {
            mockPrisma.engagementEvent.findMany.mockResolvedValue(mockEvents);
            const result = await service.summary(USER_ID);
            expect(result.totals.LIKES).toBe(300);
            expect(result.totals.VIEWS).toBe(500);
        });

        it('returns per-platform breakdown', async () => {
            mockPrisma.engagementEvent.findMany.mockResolvedValue(mockEvents);
            const result = await service.summary(USER_ID);
            expect(result.byPlatform.INSTAGRAM.LIKES).toBe(100);
            expect(result.byPlatform.TIKTOK.LIKES).toBe(200);
        });

        it('returns empty totals when no events', async () => {
            mockPrisma.engagementEvent.findMany.mockResolvedValue([]);
            const result = await service.summary(USER_ID);
            expect(Object.keys(result.totals)).toHaveLength(0);
        });
    });

    describe('timeline', () => {
        it('groups events by day', async () => {
            mockPrisma.engagementEvent.findMany.mockResolvedValue(mockEvents);
            const result = await service.timeline(USER_ID, 30);
            const todayKey = now.toISOString().slice(0, 10);
            expect(result[todayKey]).toBeDefined();
        });

        it('passes correct date filter to prisma', async () => {
            mockPrisma.engagementEvent.findMany.mockResolvedValue([]);
            await service.timeline(USER_ID, 7);
            const call = mockPrisma.engagementEvent.findMany.mock.calls[0][0];
            expect(call.where.occurredAt.gte).toBeDefined();
        });
    });

    describe('record', () => {
        it('creates an event with the correct fields', async () => {
            mockPrisma.engagementEvent.create.mockResolvedValue({});
            await service.record(USER_ID, { platform: 'INSTAGRAM' as any, metric: 'LIKES' as any, value: 50 });
            expect(mockPrisma.engagementEvent.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ userId: USER_ID, platform: 'INSTAGRAM', metric: 'LIKES', value: 50 }),
            }));
        });
    });
});
