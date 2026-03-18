import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { TEAM_REPOSITORY } from '@/domain/repositories/team.repository';
import { TEAM_MEMBER_REPOSITORY } from '@/domain/repositories/team-member.repository';
import { USER_REPOSITORY } from '@/domain/repositories/user.repository';
import { PROJECT_REPOSITORY } from '@/domain/repositories/project.repository';
import { PROJECT_MEMBER_REPOSITORY } from '@/domain/repositories/project-member.repository';
import { TASK_REPOSITORY } from '@/domain/repositories/task.repository';
import { TeamRole } from '@/common/enums/team-role.enum';
import { AccountRole } from '@/common/enums/account-role.enum';
import { ProjectRole } from '@/common/enums/project-role.enum';
import { Team } from '@/domain/models/team.model';
import { TeamMember } from '@/domain/models/team-member.model';
import { AuditService } from '../audit-logs/audit.service';

const mockTeam: Team = {
  id: 1,
  name: 'Test Team',
  description: 'A test team',
  createdAt: '2026-01-01T00:00:00.000Z',
  createdById: 10,
};

const mockOwner: TeamMember = {
  id: 1,
  userId: 10,
  teamId: 1,
  teamRole: TeamRole.OWNER,
};

const mockMember: TeamMember = {
  id: 2,
  userId: 20,
  teamId: 1,
  teamRole: TeamRole.MEMBER,
};

const mockTeamRepository = {
  findAll: jest.fn().mockResolvedValue([mockTeam]),
  findById: jest.fn().mockResolvedValue(mockTeam),
  create: jest
    .fn()
    .mockImplementation((data: Omit<Team, 'id'>) =>
      Promise.resolve({ ...data, id: 2 }),
    ),
  update: jest
    .fn()
    .mockImplementation((_id: number, partial: Partial<Team>) =>
      Promise.resolve({ ...mockTeam, ...partial }),
    ),
  delete: jest.fn().mockResolvedValue(true),
};

const mockTeamMemberRepository = {
  findAll: jest.fn().mockResolvedValue([mockOwner, mockMember]),
  findById: jest.fn().mockResolvedValue(mockOwner),
  findByTeam: jest.fn().mockResolvedValue([mockOwner, mockMember]),
  findByUser: jest.fn().mockResolvedValue([mockOwner]),
  findByUserAndTeam: jest.fn().mockResolvedValue(mockOwner),
  create: jest
    .fn()
    .mockImplementation((data: Omit<TeamMember, 'id'>) =>
      Promise.resolve({ ...data, id: 3 }),
    ),
  update: jest
    .fn()
    .mockImplementation((_id: number, partial: Partial<TeamMember>) =>
      Promise.resolve({ ...mockMember, ...partial }),
    ),
  delete: jest.fn().mockResolvedValue(true),
};

const mockUserRepository = {
  findAll: jest.fn().mockResolvedValue([]),
  findById: jest.fn().mockResolvedValue({ id: 20, login: 'user20' }),
  findByLogin: jest.fn().mockResolvedValue(null),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockProjectRepository = {
  findAll: jest.fn().mockResolvedValue([]),
  findById: jest.fn().mockResolvedValue(null),
  findByTeam: jest.fn().mockResolvedValue([]),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockProjectMemberRepository = {
  findAll: jest.fn().mockResolvedValue([]),
  findByProject: jest.fn().mockResolvedValue([]),
  findByUser: jest.fn().mockResolvedValue([]),
  findByUserAndProject: jest.fn().mockResolvedValue(null),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  deleteByProject: jest.fn().mockResolvedValue(0),
  deleteByUserAndProjects: jest.fn().mockResolvedValue(0),
};

const mockTaskRepository = {
  findAll: jest.fn().mockResolvedValue([]),
  findById: jest.fn().mockResolvedValue(null),
  findByProject: jest.fn().mockResolvedValue([]),
  findByProjects: jest.fn().mockResolvedValue([]),
  findByCreator: jest.fn().mockResolvedValue([]),
  clearAssigneeByUserAndProjects: jest.fn().mockResolvedValue(0),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn().mockResolvedValue(true),
};

const mockAuditService = {
  log: jest.fn().mockResolvedValue(undefined),
};

describe('TeamsService', () => {
  let service: TeamsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsService,
        { provide: TEAM_REPOSITORY, useValue: mockTeamRepository },
        { provide: TEAM_MEMBER_REPOSITORY, useValue: mockTeamMemberRepository },
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
        { provide: PROJECT_REPOSITORY, useValue: mockProjectRepository },
        {
          provide: PROJECT_MEMBER_REPOSITORY,
          useValue: mockProjectMemberRepository,
        },
        { provide: TASK_REPOSITORY, useValue: mockTaskRepository },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
    jest.clearAllMocks();
  });

  // ─── findAll ───

  describe('findAll', () => {
    it('should return all teams', async () => {
      const result = await service.findAll({});
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Test Team');
    });
  });

  // ─── findById ───

  describe('findById', () => {
    it('should return team by id', async () => {
      const result = await service.findById(1);
      expect(result.id).toBe(1);
    });

    it('should throw NotFoundException for missing team', async () => {
      mockTeamRepository.findById.mockResolvedValueOnce(null);
      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── create ───

  describe('create', () => {
    it('should create team and add owner membership', async () => {
      const result = await service.create(
        { name: 'New Team', description: '' },
        10,
      );
      expect(result.id).toBe(2);
      expect(mockTeamMemberRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 10, teamRole: TeamRole.OWNER }),
      );
    });
  });

  // ─── update ───

  describe('update', () => {
    it('should update team if caller is owner', async () => {
      const result = await service.update(
        1,
        { name: 'Updated' },
        10,
        AccountRole.MEMBER,
      );
      expect(result.name).toBe('Updated');
    });

    it('should throw ForbiddenException if caller is not owner', async () => {
      mockTeamMemberRepository.findByUserAndTeam.mockResolvedValueOnce({
        ...mockMember,
        teamRole: TeamRole.MEMBER,
      });
      await expect(
        service.update(1, { name: 'Hack' }, 20, AccountRole.MEMBER),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateMember', () => {
    it('should downgrade project roles to observer when team role becomes observer', async () => {
      mockTeamMemberRepository.findById.mockResolvedValueOnce(mockMember);
      mockProjectRepository.findByTeam.mockResolvedValueOnce([
        {
          id: 100,
          teamId: 1,
          name: 'Project',
        },
      ]);
      mockProjectMemberRepository.findByUser.mockResolvedValueOnce([
        {
          id: 77,
          projectId: 100,
          userId: mockMember.userId,
          role: ProjectRole.DEVELOPER,
          assignedAt: '2026-01-01T00:00:00.000Z',
        },
      ]);

      await service.updateMember(
        mockMember.id,
        { teamRole: TeamRole.OBSERVER },
        mockOwner.userId,
        AccountRole.MEMBER,
      );

      expect(mockProjectMemberRepository.update).toHaveBeenCalledWith(77, {
        role: ProjectRole.OBSERVER,
      });
    });
  });

  // ─── remove ───

  describe('remove', () => {
    it('should delete team if caller is owner', async () => {
      await expect(
        service.remove(1, 10, AccountRole.MEMBER),
      ).resolves.not.toThrow();
    });

    it('should throw NotFoundException if team does not exist', async () => {
      mockTeamRepository.findById.mockResolvedValueOnce(null);
      await expect(service.remove(999, 10, AccountRole.MEMBER)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeMember', () => {
    it('should clear assignee and delete project memberships before removing team member', async () => {
      mockTeamMemberRepository.findById.mockResolvedValueOnce(mockMember);
      mockProjectRepository.findByTeam.mockResolvedValueOnce([
        {
          id: 100,
          teamId: 1,
          name: 'Project',
        },
      ]);
      mockProjectMemberRepository.findByUser.mockResolvedValueOnce([
        {
          id: 77,
          projectId: 100,
          userId: mockMember.userId,
          role: ProjectRole.DEVELOPER,
          assignedAt: '2026-01-01T00:00:00.000Z',
        },
      ]);

      await service.removeMember(
        mockMember.id,
        mockOwner.userId,
        AccountRole.MEMBER,
      );

      expect(
        mockTaskRepository.clearAssigneeByUserAndProjects,
      ).toHaveBeenCalledWith(mockMember.userId, [100]);
      expect(
        mockProjectMemberRepository.deleteByUserAndProjects,
      ).toHaveBeenCalledWith(mockMember.userId, [100]);
      expect(mockTeamMemberRepository.delete).toHaveBeenCalledWith(
        mockMember.id,
      );
    });
  });

  // ─── addMember ───

  describe('addMember', () => {
    it('should throw ConflictException if user already a member', async () => {
      mockTeamMemberRepository.findByUserAndTeam.mockResolvedValueOnce(
        mockOwner,
      ); // caller = owner
      mockTeamMemberRepository.findByUserAndTeam.mockResolvedValueOnce(
        mockMember,
      ); // target already member
      await expect(
        service.addMember(
          1,
          { userId: 20, teamRole: TeamRole.MEMBER },
          10,
          AccountRole.MEMBER,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });
});
