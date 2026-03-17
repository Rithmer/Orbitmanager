import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { PROJECT_REPOSITORY } from '@/domain/repositories/project.repository';
import { PROJECT_MEMBER_REPOSITORY } from '@/domain/repositories/project-member.repository';
import { TEAM_MEMBER_REPOSITORY } from '@/domain/repositories/team-member.repository';
import { TASK_REPOSITORY } from '@/domain/repositories/task.repository';
import { TEAM_REPOSITORY } from '@/domain/repositories/team.repository';
import { AccountRole } from '@/common/enums/account-role.enum';
import { TeamRole } from '@/common/enums/team-role.enum';
import { ProjectRole } from '@/common/enums/project-role.enum';
import { ProjectStatus } from '@/common/enums/project-status.enum';
import { Project } from '@/domain/models/project.model';
import { ProjectMember } from '@/domain/models/project-member.model';
import { AuditService } from '../audit-logs/audit.service';

const mockProject: Project = {
  id: 1,
  teamId: 1,
  name: 'Test Project',
  description: 'A test project',
  status: ProjectStatus.ACTIVE,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockProjectMember: ProjectMember = {
  id: 1,
  projectId: 1,
  userId: 10,
  role: ProjectRole.TEAM_LEAD,
  assignedAt: '2026-01-01T00:00:00.000Z',
};

const mockOwnerMembership = {
  id: 1,
  userId: 10,
  teamId: 1,
  teamRole: TeamRole.OWNER,
};

const mockProjectRepository = {
  findAll: jest.fn().mockResolvedValue([mockProject]),
  findById: jest.fn().mockResolvedValue(mockProject),
  findByTeam: jest.fn().mockResolvedValue([mockProject]),
  findByTeams: jest.fn().mockResolvedValue([mockProject]),
  create: jest.fn().mockImplementation((data: Omit<Project, 'id'>) =>
    Promise.resolve({ ...data, id: 2 }),
  ),
  update: jest.fn().mockImplementation((_id: number, partial: Partial<Project>) =>
    Promise.resolve({ ...mockProject, ...partial }),
  ),
  delete: jest.fn().mockResolvedValue(true),
};

const mockProjectMemberRepository = {
  findAll: jest.fn().mockResolvedValue([mockProjectMember]),
  findById: jest.fn().mockResolvedValue(mockProjectMember),
  findByProject: jest.fn().mockResolvedValue([mockProjectMember]),
  findByUser: jest.fn().mockResolvedValue([mockProjectMember]),
  findByUserAndProject: jest.fn().mockResolvedValue(mockProjectMember),
  create: jest.fn().mockImplementation((data: Omit<ProjectMember, 'id'>) =>
    Promise.resolve({ ...data, id: 5 }),
  ),
  update: jest.fn().mockImplementation((_id: number, partial: Partial<ProjectMember>) =>
    Promise.resolve({ ...mockProjectMember, ...partial }),
  ),
  delete: jest.fn().mockResolvedValue(true),
  deleteByProject: jest.fn().mockResolvedValue(1),
  deleteByUserAndProjects: jest.fn().mockResolvedValue(1),
};

const mockTeamMemberRepository = {
  findAll: jest.fn().mockResolvedValue([mockOwnerMembership]),
  findByTeam: jest.fn().mockResolvedValue([mockOwnerMembership]),
  findByUser: jest.fn().mockResolvedValue([mockOwnerMembership]),
  findByUserAndTeam: jest.fn().mockResolvedValue(mockOwnerMembership),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
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

const mockTeamRepository = {
  findAll: jest.fn().mockResolvedValue([]),
  findById: jest.fn().mockResolvedValue({ id: 1, name: 'Team', description: '', createdAt: '', createdById: 10 }),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockAuditService = {
  log: jest.fn().mockResolvedValue(undefined),
};

describe('ProjectsService', () => {
  let service: ProjectsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PROJECT_REPOSITORY, useValue: mockProjectRepository },
        { provide: PROJECT_MEMBER_REPOSITORY, useValue: mockProjectMemberRepository },
        { provide: TEAM_MEMBER_REPOSITORY, useValue: mockTeamMemberRepository },
        { provide: TASK_REPOSITORY, useValue: mockTaskRepository },
        { provide: TEAM_REPOSITORY, useValue: mockTeamRepository },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    // jest.clearAllMocks() не очищает очередь once-значений — используем mockReset
    // для мока findByUserAndProject, чтобы избежать bleed между тестами
    mockProjectMemberRepository.findByUserAndProject
      .mockReset()
      .mockResolvedValue(mockProjectMember);
    mockTeamMemberRepository.findByUserAndTeam
      .mockReset()
      .mockResolvedValue(mockOwnerMembership);
    jest.clearAllMocks();
    // Восстанавливаем дефолты после clearAllMocks (который не трогает реализации)
    mockProjectMemberRepository.findByUserAndProject.mockResolvedValue(mockProjectMember);
    mockTeamMemberRepository.findByUserAndTeam.mockResolvedValue(mockOwnerMembership);
  });

  // ─── findAll ───

  describe('findAll', () => {
    it('admin sees all projects', async () => {
      mockProjectRepository.findAll.mockResolvedValueOnce([mockProject]);
      const result = await service.findAll({}, 10, AccountRole.ADMIN);
      expect(result.items).toHaveLength(1);
      expect(mockProjectRepository.findAll).toHaveBeenCalled();
    });

    it('regular user sees only visible projects (via findByTeams)', async () => {
      mockTeamMemberRepository.findByUser.mockResolvedValueOnce([mockOwnerMembership]);
      mockProjectRepository.findByTeams.mockResolvedValueOnce([mockProject]);
      const result = await service.findAll({}, 10, AccountRole.MEMBER);
      expect(result.items).toHaveLength(1);
      expect(mockProjectRepository.findByTeams).toHaveBeenCalledWith([1]);
    });

    it('returns empty list if user has no team memberships', async () => {
      mockTeamMemberRepository.findByUser.mockResolvedValueOnce([]);
      const result = await service.findAll({}, 99, AccountRole.MEMBER);
      expect(result.items).toHaveLength(0);
    });
  });

  // ─── findById ───

  describe('findById', () => {
    it('admin can find any project', async () => {
      const result = await service.findById(1, 10, AccountRole.ADMIN);
      expect(result.id).toBe(1);
    });

    it('throws NotFoundException for missing project', async () => {
      mockProjectRepository.findById.mockResolvedValueOnce(null);
      await expect(service.findById(999, 10, AccountRole.ADMIN)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException if user is not team member', async () => {
      mockTeamMemberRepository.findByUserAndTeam.mockResolvedValueOnce(null);
      await expect(service.findById(1, 99, AccountRole.MEMBER)).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── create ───

  describe('create', () => {
    it('team owner can create a project', async () => {
      const result = await service.create(
        { teamId: 1, name: 'New Project', description: '' },
        10,
        AccountRole.MEMBER,
      );
      expect(result.id).toBe(2);
      expect(result.name).toBe('New Project');
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('throws NotFoundException if team does not exist', async () => {
      mockTeamRepository.findById.mockResolvedValueOnce(null);
      await expect(
        service.create({ teamId: 999, name: 'P', description: '' }, 10, AccountRole.MEMBER),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException if caller is not team owner', async () => {
      mockTeamMemberRepository.findByUserAndTeam.mockResolvedValueOnce({
        ...mockOwnerMembership,
        teamRole: TeamRole.MEMBER,
      });
      await expect(
        service.create({ teamId: 1, name: 'P', description: '' }, 20, AccountRole.MEMBER),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── update ───

  describe('update', () => {
    it('team lead can update a project', async () => {
      // userId=10 is OWNER — assertCanManageProject returns early, no findByUserAndProject call needed
      const result = await service.update(1, { name: 'Updated' }, 10, AccountRole.MEMBER);
      expect(result.name).toBe('Updated');
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('throws ForbiddenException if caller has no role in project', async () => {
      // findById → assertProjectVisibility → findByUserAndTeam (call 1: MEMBER can see team projects)
      // assertCanManageProject → findByUserAndTeam (call 2: MEMBER, not OWNER)
      // assertCanManageProject → findByUserAndProject → null (not team lead)
      mockTeamMemberRepository.findByUserAndTeam
        .mockResolvedValueOnce({ ...mockOwnerMembership, teamRole: TeamRole.MEMBER })
        .mockResolvedValueOnce({ ...mockOwnerMembership, teamRole: TeamRole.MEMBER });
      mockProjectMemberRepository.findByUserAndProject.mockResolvedValueOnce(null);
      await expect(
        service.update(1, { name: 'Hack' }, 20, AccountRole.MEMBER),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── remove ───

  describe('remove', () => {
    it('team owner can remove a project', async () => {
      await expect(
        service.remove(1, 10, AccountRole.MEMBER),
      ).resolves.not.toThrow();
      expect(mockProjectRepository.delete).toHaveBeenCalledWith(1);
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('throws NotFoundException if project does not exist', async () => {
      mockProjectRepository.findById.mockResolvedValueOnce(null);
      await expect(service.remove(999, 10, AccountRole.ADMIN)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException if caller is not team owner', async () => {
      // findById → assertProjectVisibility → findByUserAndTeam (call 1: MEMBER can see team projects)
      // assertTeamOwnerOrAdmin → findByUserAndTeam (call 2: MEMBER → throws ForbiddenException)
      mockTeamMemberRepository.findByUserAndTeam
        .mockResolvedValueOnce({ ...mockOwnerMembership, teamRole: TeamRole.MEMBER })
        .mockResolvedValueOnce({ ...mockOwnerMembership, teamRole: TeamRole.MEMBER });
      await expect(
        service.remove(1, 20, AccountRole.MEMBER),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── addMember ───

  describe('addMember', () => {
    it('throws ConflictException if user already a project member', async () => {
      await expect(
        service.addMember(1, { userId: 10, role: ProjectRole.DEVELOPER }, 10, AccountRole.MEMBER),
      ).rejects.toThrow(ConflictException);
    });

    it('throws BadRequestException if user is not a team member', async () => {
      // findById → assertProjectVisibility → findByUserAndTeam (call 1: caller=10 OWNER)
      // assertTeamOwnerOrAdmin → findByUserAndTeam (call 2: caller=10 OWNER → passes)
      // validate dto.userId team membership → findByUserAndTeam (call 3: dto.userId=99 → null → BadRequest)
      mockProjectMemberRepository.findByUserAndProject.mockResolvedValueOnce(null);
      mockTeamMemberRepository.findByUserAndTeam
        .mockResolvedValueOnce(mockOwnerMembership)
        .mockResolvedValueOnce(mockOwnerMembership)
        .mockResolvedValueOnce(null);
      await expect(
        service.addMember(1, { userId: 99, role: ProjectRole.DEVELOPER }, 10, AccountRole.MEMBER),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeMember', () => {
    it('should clear assignee before removing a project member', async () => {
      await expect(
        service.removeMember(mockProjectMember.id, 10, AccountRole.MEMBER),
      ).resolves.not.toThrow();

      expect(mockTaskRepository.clearAssigneeByUserAndProjects).toHaveBeenCalledWith(
        mockProjectMember.userId,
        [mockProjectMember.projectId],
      );
      expect(mockProjectMemberRepository.delete).toHaveBeenCalledWith(
        mockProjectMember.id,
      );
    });
  });
});
