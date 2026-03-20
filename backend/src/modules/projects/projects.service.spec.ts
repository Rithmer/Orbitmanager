import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ProjectAccessService } from '@/common/access/project-access.service';
import { AccountRole } from '@/common/enums/account-role.enum';
import { ProjectRole } from '@/common/enums/project-role.enum';
import { ProjectStatus } from '@/common/enums/project-status.enum';
import { TeamRole } from '@/common/enums/team-role.enum';
import { ProjectMember } from '@/domain/models/project-member.model';
import { Project } from '@/domain/models/project.model';
import { PROJECT_MEMBER_REPOSITORY } from '@/domain/repositories/project-member.repository';
import { PROJECT_REPOSITORY } from '@/domain/repositories/project.repository';
import { TASK_REPOSITORY } from '@/domain/repositories/task.repository';
import { TEAM_MEMBER_REPOSITORY } from '@/domain/repositories/team-member.repository';
import { TEAM_REPOSITORY } from '@/domain/repositories/team.repository';
import { AuditService } from '../audit-logs/audit.service';
import { ProjectsService } from './projects.service';

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

const mockTeamMembership = {
  id: 1,
  userId: 10,
  teamId: 1,
  teamRole: TeamRole.OWNER,
};

const paginatedProjects = {
  items: [mockProject],
  total: 1,
  page: 1,
  limit: 20,
  totalPages: 1,
};

const mockProjectRepository = {
  findAll: jest.fn().mockResolvedValue([mockProject]),
  findById: jest.fn().mockResolvedValue(mockProject),
  findPage: jest.fn().mockResolvedValue(paginatedProjects),
  findByTeam: jest.fn().mockResolvedValue([mockProject]),
  findByTeams: jest.fn().mockResolvedValue([mockProject]),
  create: jest
    .fn()
    .mockImplementation((data: Omit<Project, 'id'>) =>
      Promise.resolve({ ...data, id: 2 }),
    ),
  update: jest
    .fn()
    .mockImplementation((_id: number, partial: Partial<Project>) =>
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
  create: jest
    .fn()
    .mockImplementation((data: Omit<ProjectMember, 'id'>) =>
      Promise.resolve({ ...data, id: 5 }),
    ),
  update: jest
    .fn()
    .mockImplementation((_id: number, partial: Partial<ProjectMember>) =>
      Promise.resolve({ ...mockProjectMember, ...partial }),
    ),
  delete: jest.fn().mockResolvedValue(true),
  deleteByProject: jest.fn().mockResolvedValue(1),
  deleteByUserAndProjects: jest.fn().mockResolvedValue(1),
};

const mockTeamMemberRepository = {
  findAll: jest.fn().mockResolvedValue([mockTeamMembership]),
  findByTeam: jest.fn().mockResolvedValue([mockTeamMembership]),
  findByUser: jest.fn().mockResolvedValue([mockTeamMembership]),
  findByUserAndTeam: jest.fn().mockResolvedValue(mockTeamMembership),
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
  findById: jest.fn().mockResolvedValue({
    id: 1,
    name: 'Team',
    description: '',
    createdAt: '',
    createdById: 10,
  }),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockAuditService = {
  log: jest.fn().mockResolvedValue(undefined),
};

const mockProjectAccessService = {
  getVisibleProjects: jest.fn().mockResolvedValue([mockProject]),
  getVisibleProjectIds: jest.fn().mockResolvedValue([mockProject.id]),
  assertProjectVisibility: jest.fn().mockResolvedValue(undefined),
  assertTeamOwnerOrAdmin: jest.fn().mockResolvedValue(undefined),
  assertCanManageProject: jest.fn().mockResolvedValue(undefined),
};

describe('ProjectsService', () => {
  let service: ProjectsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PROJECT_REPOSITORY, useValue: mockProjectRepository },
        {
          provide: PROJECT_MEMBER_REPOSITORY,
          useValue: mockProjectMemberRepository,
        },
        { provide: TEAM_MEMBER_REPOSITORY, useValue: mockTeamMemberRepository },
        { provide: TASK_REPOSITORY, useValue: mockTaskRepository },
        { provide: TEAM_REPOSITORY, useValue: mockTeamRepository },
        { provide: AuditService, useValue: mockAuditService },
        {
          provide: ProjectAccessService,
          useValue: mockProjectAccessService,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);

    mockProjectAccessService.getVisibleProjects.mockResolvedValue([
      mockProject,
    ]);
    mockProjectAccessService.getVisibleProjectIds.mockResolvedValue([
      mockProject.id,
    ]);
    mockProjectAccessService.assertProjectVisibility.mockResolvedValue(
      undefined,
    );
    mockProjectAccessService.assertTeamOwnerOrAdmin.mockResolvedValue(
      undefined,
    );
    mockProjectAccessService.assertCanManageProject.mockResolvedValue(
      undefined,
    );
    mockProjectRepository.findById.mockResolvedValue(mockProject);
    mockProjectMemberRepository.findByUserAndProject.mockResolvedValue(
      mockProjectMember,
    );
    mockTeamMemberRepository.findByUserAndTeam.mockResolvedValue(
      mockTeamMembership,
    );
  });

  describe('findAll', () => {
    it('admin sees all projects', async () => {
      const result = await service.findAll({}, 10, AccountRole.ADMIN);
      expect(result.items).toHaveLength(1);
      expect(mockProjectRepository.findPage).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 20 }),
      );
    });

    it('regular user sees only visible projects via access service', async () => {
      const result = await service.findAll({}, 10, AccountRole.MEMBER);
      expect(result.items).toHaveLength(1);
      expect(
        mockProjectAccessService.getVisibleProjectIds,
      ).toHaveBeenCalledWith(10);
      expect(mockProjectRepository.findPage).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 20, projectIds: [mockProject.id] }),
      );
    });
  });

  describe('findById', () => {
    it('admin can find any project', async () => {
      const result = await service.findById(1, 10, AccountRole.ADMIN);
      expect(result.id).toBe(1);
    });

    it('throws NotFoundException for missing project', async () => {
      mockProjectRepository.findById.mockResolvedValueOnce(null);
      await expect(
        service.findById(999, 10, AccountRole.ADMIN),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException if access service rejects request', async () => {
      mockProjectAccessService.assertProjectVisibility.mockRejectedValueOnce(
        new ForbiddenException(),
      );
      await expect(service.findById(1, 99, AccountRole.MEMBER)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('create', () => {
    it('creates a project for team owner', async () => {
      const result = await service.create(
        { teamId: 1, name: 'New Project', description: '' },
        10,
        AccountRole.MEMBER,
      );

      expect(result.id).toBe(2);
      expect(
        mockProjectAccessService.assertTeamOwnerOrAdmin,
      ).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('throws NotFoundException if team does not exist', async () => {
      mockTeamRepository.findById.mockResolvedValueOnce(null);
      await expect(
        service.create(
          { teamId: 999, name: 'P', description: '' },
          10,
          AccountRole.MEMBER,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException if access service blocks creation', async () => {
      mockProjectAccessService.assertTeamOwnerOrAdmin.mockRejectedValueOnce(
        new ForbiddenException(),
      );
      await expect(
        service.create(
          { teamId: 1, name: 'P', description: '' },
          20,
          AccountRole.MEMBER,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('updates project when management is allowed', async () => {
      const result = await service.update(
        1,
        { name: 'Updated' },
        10,
        AccountRole.MEMBER,
      );

      expect(result.name).toBe('Updated');
      expect(
        mockProjectAccessService.assertCanManageProject,
      ).toHaveBeenCalled();
    });

    it('throws ForbiddenException if caller cannot manage project', async () => {
      mockProjectAccessService.assertCanManageProject.mockRejectedValueOnce(
        new ForbiddenException(),
      );
      await expect(
        service.update(1, { name: 'Hack' }, 20, AccountRole.MEMBER),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('removes project using repository cascade only', async () => {
      await expect(
        service.remove(1, 10, AccountRole.MEMBER),
      ).resolves.not.toThrow();

      expect(mockProjectRepository.delete).toHaveBeenCalledWith(1);
      expect(mockTaskRepository.findByProject).not.toHaveBeenCalled();
      expect(
        mockProjectMemberRepository.deleteByProject,
      ).not.toHaveBeenCalled();
    });
  });

  describe('addMember', () => {
    it('throws ConflictException if user already a project member', async () => {
      await expect(
        service.addMember(
          1,
          { userId: 10, role: ProjectRole.DEVELOPER },
          10,
          AccountRole.MEMBER,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('throws BadRequestException if user is not a team member', async () => {
      mockProjectMemberRepository.findByUserAndProject.mockResolvedValueOnce(
        null,
      );
      mockTeamMemberRepository.findByUserAndTeam.mockResolvedValueOnce(null);

      await expect(
        service.addMember(
          1,
          { userId: 99, role: ProjectRole.DEVELOPER },
          10,
          AccountRole.MEMBER,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeMember', () => {
    it('clears assignee before removing a project member', async () => {
      await service.removeMember(mockProjectMember.id, 10, AccountRole.MEMBER);

      expect(
        mockTaskRepository.clearAssigneeByUserAndProjects,
      ).toHaveBeenCalledWith(mockProjectMember.userId, [
        mockProjectMember.projectId,
      ]);
      expect(mockProjectMemberRepository.delete).toHaveBeenCalledWith(
        mockProjectMember.id,
      );
    });
  });
});
