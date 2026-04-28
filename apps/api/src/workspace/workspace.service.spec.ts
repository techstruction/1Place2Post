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

    it('successfully invites a new member with default MEMBER role', async () => {
      mockPrisma.workspaceMember.findUnique
        .mockResolvedValueOnce({ role: 'ADMIN' })
        .mockResolvedValueOnce(null);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u2' });
      mockPrisma.workspaceMember.create.mockResolvedValue({ id: 'mem1', role: 'MEMBER', user: { id: 'u2', name: 'Bob', email: 'x@x.com' } });
      const result = await service.invite('u1', 'ws1', { email: 'x@x.com' });
      expect(result.role).toBe('MEMBER');
    });
  });

  describe('updateMemberRole', () => {
    it('updates role when requester is OWNER', async () => {
      mockPrisma.workspaceMember.findUnique
        .mockResolvedValueOnce({ role: 'OWNER' })
        .mockResolvedValueOnce({ id: 'mem2', role: 'MEMBER' });
      mockPrisma.workspaceMember.update.mockResolvedValue({ id: 'mem2', role: 'ADMIN' });
      const result = await service.updateMemberRole('u1', 'ws1', 'u2', { role: 'ADMIN' });
      expect(mockPrisma.workspaceMember.update).toHaveBeenCalled();
    });

    it('throws ForbiddenException when trying to set role to OWNER', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({ role: 'OWNER' });
      await expect(service.updateMemberRole('u1', 'ws1', 'u2', { role: 'OWNER' })).rejects.toThrow(ForbiddenException);
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

    it('successfully removes a non-owner member', async () => {
      mockPrisma.workspaceMember.findUnique
        .mockResolvedValueOnce({ role: 'ADMIN' })
        .mockResolvedValueOnce({ id: 'mem3', role: 'MEMBER' });
      mockPrisma.workspaceMember.delete.mockResolvedValue({ id: 'mem3' });
      await service.removeMember('u1', 'ws1', 'u2');
      expect(mockPrisma.workspaceMember.delete).toHaveBeenCalled();
    });
  });
});
