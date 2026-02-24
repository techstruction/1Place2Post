import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { TemplateService } from './template.service';
import { PrismaService } from '../prisma/prisma.service';

const USER_ID = 'user-1';
const OTHER_ID = 'user-2';
const TMPL_ID = 'tmpl-1';
const mockTemplate = { id: TMPL_ID, userId: USER_ID, name: 'Product Launch', content: 'Check this out!', hashtags: ['#launch'], platform: null, description: null, createdAt: new Date(), updatedAt: new Date() };

const mockPrisma = {
    template: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
};

describe('TemplateService', () => {
    let service: TemplateService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [TemplateService, { provide: PrismaService, useValue: mockPrisma }],
        }).compile();
        service = module.get<TemplateService>(TemplateService);
        jest.clearAllMocks();
    });

    describe('findOne', () => {
        it('returns template for owner', async () => {
            mockPrisma.template.findUnique.mockResolvedValue(mockTemplate);
            const t = await service.findOne(USER_ID, TMPL_ID);
            expect(t.name).toBe('Product Launch');
        });
        it('throws ForbiddenException for non-owner', async () => {
            mockPrisma.template.findUnique.mockResolvedValue(mockTemplate);
            await expect(service.findOne(OTHER_ID, TMPL_ID)).rejects.toThrow(ForbiddenException);
        });
        it('throws NotFoundException when missing', async () => {
            mockPrisma.template.findUnique.mockResolvedValue(null);
            await expect(service.findOne(USER_ID, 'x')).rejects.toThrow(NotFoundException);
        });
    });

    describe('apply', () => {
        it('returns pre-filled post shape', async () => {
            mockPrisma.template.findUnique.mockResolvedValue(mockTemplate);
            const result = await service.apply(USER_ID, TMPL_ID);
            expect(result.caption).toBe(mockTemplate.content);
            expect(result.hashtags).toEqual(mockTemplate.hashtags);
            expect(result.status).toBe('DRAFT');
        });
    });

    describe('remove', () => {
        it('deletes owned template', async () => {
            mockPrisma.template.findUnique.mockResolvedValue(mockTemplate);
            mockPrisma.template.delete.mockResolvedValue(mockTemplate);
            await service.remove(USER_ID, TMPL_ID);
            expect(mockPrisma.template.delete).toHaveBeenCalled();
        });
    });
});
