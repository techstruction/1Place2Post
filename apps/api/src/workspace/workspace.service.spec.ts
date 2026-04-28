import { Test } from '@nestjs/testing';
import { WorkspaceService } from './workspace.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';

const mockPrisma = {
  workspace: { create: jest.fn(), findUnique: jest.fn() },
  workspaceMember: {
    findMany: jest.fn(), findUnique: jest.fn(),
    create: jest.fn(), update: jest.fn(), delete: jest.fn(),
  },
  user: { findUnique: jest.fn() },
};

describe('WorkspaceService', () => {
  let service: WorkspaceService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        WorkspaceService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(WorkspaceService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates a workspace and adds creator as OWNER', async () => {
      mockPrisma.workspace.create.mockResolvedValue({ id: 'ws1', name: 'Acme', members: [] });
      const result = await service.create('user1', { name: 'Acme' });
      expect(mockPrisma.workspace.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ ownerId: 'user1', name: 'Acme' }),
        })
      );
      expect(result.id).toBe('ws1');
    });
  });

  describe('invite', () => {
    it('throws ForbiddenException if requester is not OWNER or ADMIN', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({ role: 'MEMBER' });
      await expect(service.invite('u1', 'ws1', { email: 'x@x.com' })).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException if invitee email does not exist', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({ role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.invite('u1', 'ws1', { email: 'ghost@x.com' })).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException if invitee is already a member', async () => {
      mockPrisma.workspaceMember.findUnique
        .mockResolvedValueOnce({ role: 'ADMIN' })
        .mockResolvedValueOnce({ id: 'existing' });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u2' });
      await expect(service.invite('u1', 'ws1', { email: 'x@x.com' })).rejects.toThrow(ConflictException);
    });
  });

  describe('removeMember', () => {
    it('throws ForbiddenException if requester tries to remove themselves', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({ role: 'OWNER' });
      await expect(service.removeMember('u1', 'ws1', 'u1')).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException if trying to remove workspace owner', async () => {
      mockPrisma.workspaceMember.findUnique
        .mockResolvedValueOnce({ role: 'ADMIN' })
        .mockResolvedValueOnce({ role: 'OWNER', id: 'mem1' });
      await expect(service.removeMember('u1', 'ws1', 'u2')).rejects.toThrow(ForbiddenException);
    });
  });
});
