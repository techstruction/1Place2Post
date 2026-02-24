import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { PostService } from './post.service';
import { PrismaService } from '../prisma/prisma.service';

const USER_ID = 'user-1';
const OTHER_USER_ID = 'user-2';
const POST_ID = 'post-1';

const mockPost = {
    id: POST_ID,
    userId: USER_ID,
    title: null,
    caption: 'Test caption #launch',
    hashtags: ['#launch'],
    status: 'DRAFT',
    scheduledAt: null,
    publishedAt: null,
    seriesId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    platforms: [],
    mediaFiles: [],
};

const mockPrisma = {
    post: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
};

describe('PostService', () => {
    let service: PostService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PostService,
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();

        service = module.get<PostService>(PostService);
        jest.clearAllMocks();
    });

    // ── create ────────────────────────────────────────────────────────────────
    describe('create', () => {
        it('creates a post with DRAFT status by default', async () => {
            mockPrisma.post.create.mockResolvedValue(mockPost);

            const result = await service.create(USER_ID, { caption: 'Test caption #launch' });

            expect(mockPrisma.post.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        userId: USER_ID,
                        caption: 'Test caption #launch',
                    }),
                }),
            );
            expect(result.caption).toBe('Test caption #launch');
        });

        it('sets scheduledAt when provided', async () => {
            const scheduledAt = '2026-03-01T10:00:00Z';
            const scheduledPost = { ...mockPost, status: 'SCHEDULED', scheduledAt: new Date(scheduledAt) };
            mockPrisma.post.create.mockResolvedValue(scheduledPost);

            await service.create(USER_ID, { caption: 'Scheduled post', scheduledAt });

            const createCall = mockPrisma.post.create.mock.calls[0][0];
            expect(createCall.data.scheduledAt).toEqual(new Date(scheduledAt));
        });
    });

    // ── findAll ───────────────────────────────────────────────────────────────
    describe('findAll', () => {
        it('returns posts for the current user', async () => {
            mockPrisma.post.findMany.mockResolvedValue([mockPost]);

            const result = await service.findAll(USER_ID);

            expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: { userId: USER_ID } }),
            );
            expect(result).toHaveLength(1);
        });
    });

    // ── findOne ───────────────────────────────────────────────────────────────
    describe('findOne', () => {
        it('returns a post owned by the user', async () => {
            mockPrisma.post.findUnique.mockResolvedValue(mockPost);
            const result = await service.findOne(USER_ID, POST_ID);
            expect(result.id).toBe(POST_ID);
        });

        it('throws NotFoundException when post does not exist', async () => {
            mockPrisma.post.findUnique.mockResolvedValue(null);
            await expect(service.findOne(USER_ID, 'nonexistent')).rejects.toThrow(NotFoundException);
        });

        it('throws ForbiddenException when user does not own the post', async () => {
            mockPrisma.post.findUnique.mockResolvedValue(mockPost);
            await expect(service.findOne(OTHER_USER_ID, POST_ID)).rejects.toThrow(ForbiddenException);
        });
    });

    // ── update ────────────────────────────────────────────────────────────────
    describe('update', () => {
        it('updates caption when provided', async () => {
            mockPrisma.post.findUnique.mockResolvedValue(mockPost);
            mockPrisma.post.update.mockResolvedValue({ ...mockPost, caption: 'Updated caption' });

            const result = await service.update(USER_ID, POST_ID, { caption: 'Updated caption' });

            expect(mockPrisma.post.update).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: POST_ID } }),
            );
            expect(result.caption).toBe('Updated caption');
        });

        it('throws ForbiddenException when updating another users post', async () => {
            mockPrisma.post.findUnique.mockResolvedValue(mockPost);
            await expect(
                service.update(OTHER_USER_ID, POST_ID, { caption: 'Hack' }),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    // ── remove ────────────────────────────────────────────────────────────────
    describe('remove', () => {
        it('deletes a post owned by the user', async () => {
            mockPrisma.post.findUnique.mockResolvedValue(mockPost);
            mockPrisma.post.delete.mockResolvedValue(mockPost);

            await service.remove(USER_ID, POST_ID);

            expect(mockPrisma.post.delete).toHaveBeenCalledWith({ where: { id: POST_ID } });
        });

        it('throws ForbiddenException when deleting another users post', async () => {
            mockPrisma.post.findUnique.mockResolvedValue(mockPost);
            await expect(service.remove(OTHER_USER_ID, POST_ID)).rejects.toThrow(ForbiddenException);
        });
    });
});
