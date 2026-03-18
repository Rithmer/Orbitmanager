import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { createPrismaMock, type PrismaMock } from '@/test-utils/mock-prisma';
import { TeamRole } from '@/common/enums/team-role.enum';
import { AccountRole } from '@/common/enums/account-role.enum';
import { ProjectRole } from '@/common/enums/project-role.enum';
import { AuditService } from '../audit-logs/audit.service';
import { TeamsService } from './teams.service';

describe('TeamsService', () => {
  let service: TeamsService;
  let prisma: PrismaMock;

  const mockAuditService = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  const mockTeam = {
    id: 1,
    name: 'Test Team',
    description: 'A test team',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    createdById: 10,
  };

  const mockOwner = {
    id: 1,
    userId: 10,
    teamId: 1,
    teamRole: TeamRole.OWNER,
  };

  const mockMember = {
    id: 2,
    userId: 20,
    teamId: 1,
    teamRole: TeamRole.MEMBER,
  };

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
    jest.clearAllMocks();
  });

  it('returns paginated teams', async () => {
    prisma.team.count.mockResolvedValueOnce(1);
    prisma.team.findMany.mockResolvedValueOnce([mockTeam]);

    const result = await service.findAll({});

    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe('Test Team');
  });

  it('throws not found for missing team', async () => {
    prisma.team.findUnique.mockResolvedValueOnce(null);

    await expect(service.findById(999)).rejects.toThrow(NotFoundException);
  });

  it('creates team and owner membership inside transaction', async () => {
    prisma.team.create.mockResolvedValueOnce({ ...mockTeam, id: 2 });
    prisma.teamMember.create.mockResolvedValueOnce({ ...mockOwner, teamId: 2 });

    const result = await service.create({ name: 'New Team', description: '' }, 10);

    expect(result.id).toBe(2);
    expect(prisma.teamMember.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 10,
          teamRole: TeamRole.OWNER,
        }),
      }),
    );
  });

  it('updates team only for owner/admin', async () => {
    prisma.team.findUnique.mockResolvedValueOnce(mockTeam);
    prisma.teamMember.findUnique.mockResolvedValueOnce(mockOwner);
    prisma.team.update.mockResolvedValueOnce({ ...mockTeam, name: 'Updated' });

    const result = await service.update(1, { name: 'Updated' }, 10, AccountRole.MEMBER);

    expect(result.name).toBe('Updated');
  });

  it('blocks non-owner from updating team', async () => {
    prisma.team.findUnique.mockResolvedValueOnce(mockTeam);
    prisma.teamMember.findUnique.mockResolvedValueOnce(mockMember);

    await expect(
      service.update(1, { name: 'Hack' }, 20, AccountRole.MEMBER),
    ).rejects.toThrow(ForbiddenException);
  });

  it('blocks duplicate team member assignment', async () => {
    prisma.team.findUnique.mockResolvedValueOnce(mockTeam);
    prisma.teamMember.findUnique
      .mockResolvedValueOnce(mockOwner)
      .mockResolvedValueOnce(mockMember);
    prisma.user.findUnique.mockResolvedValueOnce({ id: 20 });

    await expect(
      service.addMember(
        1,
        { userId: 20, teamRole: TeamRole.MEMBER },
        10,
        AccountRole.MEMBER,
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('downgrades project roles when member becomes observer', async () => {
    prisma.teamMember.findUnique
      .mockResolvedValueOnce(mockMember)
      .mockResolvedValueOnce(mockOwner);
    prisma.project.findMany.mockResolvedValueOnce([{ id: 100 }]);
    prisma.projectMember.findMany.mockResolvedValueOnce([
      {
        id: 77,
        projectId: 100,
        userId: mockMember.userId,
        role: ProjectRole.DEVELOPER,
        assignedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]);
    prisma.projectMember.update.mockResolvedValueOnce({
      id: 77,
      role: ProjectRole.OBSERVER,
    });
    prisma.teamMember.update.mockResolvedValueOnce({
      ...mockMember,
      teamRole: TeamRole.OBSERVER,
    });

    await service.updateMember(
      mockMember.id,
      { teamRole: TeamRole.OBSERVER },
      mockOwner.userId,
      AccountRole.MEMBER,
    );

    expect(prisma.projectMember.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 77 },
        data: { role: ProjectRole.OBSERVER },
      }),
    );
  });

  it('clears assignments and project memberships before removing member', async () => {
    prisma.teamMember.findUnique
      .mockResolvedValueOnce(mockMember)
      .mockResolvedValueOnce(mockOwner);
    prisma.project.findMany.mockResolvedValueOnce([{ id: 100 }]);
    prisma.projectMember.findMany.mockResolvedValueOnce([
      {
        id: 77,
        projectId: 100,
        userId: mockMember.userId,
        role: ProjectRole.DEVELOPER,
        assignedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]);
    prisma.task.updateMany.mockResolvedValueOnce({ count: 1 });
    prisma.projectMember.deleteMany.mockResolvedValueOnce({ count: 1 });
    prisma.teamMember.delete.mockResolvedValueOnce(mockMember);

    await service.removeMember(mockMember.id, mockOwner.userId, AccountRole.MEMBER);

    expect(prisma.task.updateMany).toHaveBeenCalled();
    expect(prisma.projectMember.deleteMany).toHaveBeenCalled();
    expect(prisma.teamMember.delete).toHaveBeenCalledWith({ where: { id: mockMember.id } });
  });
});
