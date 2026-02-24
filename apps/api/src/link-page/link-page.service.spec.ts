import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { LinkPageService } from './link-page.service';
import { PrismaService } from '../prisma/prisma.service';

const USER_ID = 'user-1';
const OTHER_ID = 'user-2';
const PAGE_ID = 'page-1';
const ITEM_ID = 'item-1';

const mockPage = { id: PAGE_ID, userId: USER_ID, slug: 'my-links', title: 'My Links', bio: null, avatarUrl: null, published: false, createdAt: new Date(), updatedAt: new Date() };
const mockItem = { id: ITEM_ID, linkPageId: PAGE_ID, label: 'GitHub', url: 'https://github.com', sortOrder: 0, active: true, createdAt: new Date() };

const mockPrisma = {
    linkPage: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    linkItem: {
        create: jest.fn(),
        count: jest.fn(),
        delete: jest.fn(),
    },
    linkClick: { create: jest.fn() },
};

describe('LinkPageService', () => {
    let service: LinkPageService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [LinkPageService, { provide: PrismaService, useValue: mockPrisma }],
        }).compile();
        service = module.get<LinkPageService>(LinkPageService);
        jest.clearAllMocks();
    });

    describe('createPage', () => {
        it('creates a page when slug is available', async () => {
            mockPrisma.linkPage.findUnique.mockResolvedValue(null);
            mockPrisma.linkPage.create.mockResolvedValue({ ...mockPage, items: [] });
            const result = await service.createPage(USER_ID, { slug: 'my-links', title: 'My Links' });
            expect(result.slug).toBe('my-links');
        });

        it('throws ConflictException when slug is taken', async () => {
            mockPrisma.linkPage.findUnique.mockResolvedValue(mockPage);
            await expect(service.createPage(USER_ID, { slug: 'my-links', title: 'X' })).rejects.toThrow(ConflictException);
        });
    });

    describe('updatePage', () => {
        it('throws ForbiddenException for another user', async () => {
            mockPrisma.linkPage.findUnique.mockResolvedValue(mockPage);
            await expect(service.updatePage(OTHER_ID, PAGE_ID, { title: 'Hacked' })).rejects.toThrow(ForbiddenException);
        });
        it('throws NotFoundException when page missing', async () => {
            mockPrisma.linkPage.findUnique.mockResolvedValue(null);
            await expect(service.updatePage(USER_ID, 'x', {})).rejects.toThrow(NotFoundException);
        });
    });

    describe('addItem', () => {
        it('adds item to user-owned page', async () => {
            mockPrisma.linkPage.findUnique.mockResolvedValue(mockPage);
            mockPrisma.linkItem.count.mockResolvedValue(0);
            mockPrisma.linkItem.create.mockResolvedValue(mockItem);
            const item = await service.addItem(USER_ID, PAGE_ID, { label: 'GitHub', url: 'https://github.com' });
            expect(item.label).toBe('GitHub');
        });
        it('throws ForbiddenException for another user', async () => {
            mockPrisma.linkPage.findUnique.mockResolvedValue(mockPage);
            await expect(service.addItem(OTHER_ID, PAGE_ID, { label: 'X', url: 'https://x.com' })).rejects.toThrow(ForbiddenException);
        });
    });

    describe('getPublicPage', () => {
        it('calls findUnique with published:true', async () => {
            mockPrisma.linkPage.findUnique.mockResolvedValue(null);
            await service.getPublicPage('some-slug');
            expect(mockPrisma.linkPage.findUnique).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ published: true }),
            }));
        });
    });

    describe('recordClick', () => {
        it('records a click with hashed IP', async () => {
            mockPrisma.linkPage.findUnique.mockResolvedValue(mockPage);
            mockPrisma.linkClick.create.mockResolvedValue({});
            await service.recordClick('my-links', ITEM_ID, '1.2.3.4');
            const call = mockPrisma.linkClick.create.mock.calls[0][0];
            expect(call.data.ipHash).toBeDefined();
            expect(call.data.ipHash).not.toBe('1.2.3.4'); // should be hashed
        });
        it('does nothing for unknown slug', async () => {
            mockPrisma.linkPage.findUnique.mockResolvedValue(null);
            await service.recordClick('nonexistent');
            expect(mockPrisma.linkClick.create).not.toHaveBeenCalled();
        });
    });
});
