import { Test, TestingModule } from '@nestjs/testing';
import { BotRuleService } from './bot-rule.service';
import { PrismaService } from '../prisma/prisma.service';

const USER_ID = 'user-1';
const RULE_ID = 'rule-1';
const mockRule = { id: RULE_ID, userId: USER_ID, name: 'Pricing', matchType: 'CONTAINS', matchValue: 'pricing', replyText: 'Here are our prices', webhookUrl: null, active: true };

const mockPrisma = {
    botRule: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    inboxMessage: { create: jest.fn().mockResolvedValue({ id: 'msg-1' }) },
    botActionLog: { create: jest.fn() },
    lead: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn() },
};

// Stub global fetch to avoid real HTTP calls
global.fetch = jest.fn().mockResolvedValue({ ok: true }) as any;

describe('BotRuleService', () => {
    let service: BotRuleService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [BotRuleService, { provide: PrismaService, useValue: mockPrisma }],
        }).compile();
        service = module.get<BotRuleService>(BotRuleService);
        jest.clearAllMocks();
    });

    describe('processIngest', () => {
        it('returns matched:true and fires webhook for CONTAINS match', async () => {
            const rule = { ...mockRule, webhookUrl: 'https://example.com/hook' };
            mockPrisma.botRule.findMany.mockResolvedValue([rule]);
            const result = await service.processIngest(USER_ID, 'what is your pricing?', 'instagram');
            expect(result.matched).toBe(true);
            expect(result.rule).toBe('Pricing');
            expect(global.fetch).toHaveBeenCalledWith('https://example.com/hook', expect.objectContaining({ method: 'POST' }));
        });

        it('returns matched:false when no rule matches', async () => {
            mockPrisma.botRule.findMany.mockResolvedValue([mockRule]);
            const result = await service.processIngest(USER_ID, 'hello world', 'instagram');
            expect(result.matched).toBe(false);
        });

        it('matches REGEX rules', async () => {
            const regexRule = { ...mockRule, matchType: 'REGEX', matchValue: 'price[sd]?', webhookUrl: 'https://example.com/hook' };
            mockPrisma.botRule.findMany.mockResolvedValue([regexRule]);
            const result = await service.processIngest(USER_ID, 'can you tell me the prices?', 'tiktok');
            expect(result.matched).toBe(true);
        });

        it('matches ANY rule regardless of message', async () => {
            const anyRule = { ...mockRule, matchType: 'ANY', webhookUrl: 'https://ex.com' };
            mockPrisma.botRule.findMany.mockResolvedValue([anyRule]);
            const result = await service.processIngest(USER_ID, 'random message xyz', 'facebook');
            expect(result.matched).toBe(true);
        });

        it('does not fire webhook when webhookUrl is null', async () => {
            mockPrisma.botRule.findMany.mockResolvedValue([mockRule]); // webhookUrl: null
            const result = await service.processIngest(USER_ID, 'tell me about pricing', 'instagram');
            expect(result.matched).toBe(true); // matches but no webhook fired
            expect(global.fetch).not.toHaveBeenCalled();
        });
    });
});
