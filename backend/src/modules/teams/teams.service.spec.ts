import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { TEAM_REPOSITORY } from '../../domain/repositories/team.repository';
import { TEAM_MEMBER_REPOSITORY } from '../../domain/repositories/team-member.repository';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository';
import { PROJECT_REPOSITORY } from '../../domain/repositories/project.repository';
import { PROJECT_MEMBER_REPOSITORY } from '../../domain/repositories/project-member.repository';
import { TeamRole } from '../../common/enums/team-role.enum';
import { AccountRole } from '../../common/enums/account-role.enum';
import { Team } from '../../domain/models/team.model';
import { TeamMember } from '../../domain/models/team-member.model';

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
  create: jest.fn().mockImplementation((data: Omit<Team, 'id'>) =>
    Promise.resolve({ ...data, id: 2 }),
  ),
  update: jest.fn().mockImplementation((_id: number, partial: Partial<Team>) =>
    Promise.resolve({ ...mockTeam, ...partial }),
  ),
  delete: jest.fn().mockResolvedValue(true),
};

const mockTeamMemberRepository = {
  findAll: jest.fn().mockResolvedValue([mockOwner, mockMember]),
  findByTeam: jest.fn().mockResolvedValue([mockOwner, mockMember]),
  findByUser: jest.fn().mockResolvedValue([mockOwner]),
  findByUserAndTeam: jest.fn().mockResolvedValue(mockOwner),
  create: jest.fn().mockImplementation((data: Omit<TeamMember, 'id'>) =>
    Promise.resolve({ ...data, id: 3 }),
  ),
  update: jest.fn().mockImplementation((_id: number, partial: Partial<TeamMember>) =>
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

const mockJsonFileService = {
  read: jest.fn().mockResolvedValue({ meta: { entity: 'projects', lastId: 0 }, items: [] }),
  remove: jest.fn().mockResolvedValue(true),
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
        { provide: PROJECT_MEMBER_REPOSITORY, useValue: mockProjectMemberRepository },
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
    jest.resetAllMocks();

    mockTeamRepository.findById.mockResolvedValue(mockTeam);
    mockTeamRepository.findAll.mockResolvedValue([mockTeam]);
    mockTeamRepository.create.mockImplementation((data: Omit<Team, 'id'>) =>
      Promise.resolve({ ...data, id: 2 } as Team),
    );
    mockTeamRepository.update.mockImplementation((_id: number, partial: Partial<Team>) =>
      Promise.resolve({ ...mockTeam, ...partial }),
    );
    mockTeamRepository.delete.mockResolvedValue(true);

    mockTeamMemberRepository.findAll.mockResolvedValue([mockOwner, mockMember]);
    mockTeamMemberRepository.findByTeam.mockResolvedValue([mockOwner, mockMember]);
    mockTeamMemberRepository.findByUser.mockResolvedValue([mockOwner]);
    mockTeamMemberRepository.findByUserAndTeam.mockResolvedValue(mockOwner);
    mockTeamMemberRepository.create.mockImplementation((data: Omit<TeamMember, 'id'>) =>
      Promise.resolve({ ...data, id: 3 } as TeamMember),
    );
    mockTeamMemberRepository.update.mockImplementation((_id: number, partial: Partial<TeamMember>) =>
      Promise.resolve({ ...mockMember, ...partial } as TeamMember),
    );
    mockTeamMemberRepository.delete.mockResolvedValue(true);

    mockUserRepository.findById.mockResolvedValue({ id: 20, login: 'user20' });
    mockProjectRepository.findByTeam.mockResolvedValue([]);
    mockProjectMemberRepository.deleteByProject.mockResolvedValue(0);
    mockProjectMemberRepository.deleteByUserAndProjects.mockResolvedValue(0);
  });

  describe('findAll', () => {
    it('should return paginated teams', async () => {
      const result = await service.findAll({});
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('findById', () => {
    it('should return team', async () => {
      const result = await service.findById(1);
      expect(result.name).toBe('Test Team');
    });

    it('should throw NotFoundException', async () => {
      mockTeamRepository.findById.mockResolvedValueOnce(null);
      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create team and add creator as owner', async () => {
      const result = await service.create({ name: 'New Team' }, 10);
      expect(result.id).toBe(2);
      expect(mockTeamMemberRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 10,
          teamRole: TeamRole.OWNER,
        }),
      );
    });
  });

  describe('update', () => {
    it('should allow owner to update', async () => {
      const result = await service.update(1, { name: 'Updated' }, 10, AccountRole.MEMBER);
      expect(result.name).toBe('Updated');
    });

    it('should allow admin to update', async () => {
      mockTeamMemberRepository.findByUserAndTeam.mockResolvedValueOnce(null);
      const result = await service.update(1, { name: 'Admin Updated' }, 99, AccountRole.ADMIN);
      expect(result.name).toBe('Admin Updated');
    });

    it('should reject non-owner', async () => {
      mockTeamMemberRepository.findByUserAndTeam.mockResolvedValueOnce(mockMember);
      await expect(
        service.update(1, { name: 'X' }, 20, AccountRole.MEMBER),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should allow owner to delete', async () => {
      mockTeamMemberRepository.findByUserAndTeam.mockResolvedValue(mockOwner);
      mockTeamMemberRepository.findByTeam.mockResolvedValue([mockOwner, mockMember]);
      mockProjectRepository.findByTeam.mockResolvedValue([]);
      await service.remove(1, 10, AccountRole.MEMBER);
      expect(mockTeamRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should reject non-owner', async () => {
      mockTeamMemberRepository.findByUserAndTeam.mockResolvedValue(mockMember);
      await expect(
        service.remove(1, 20, AccountRole.MEMBER),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findMembers', () => {
    it('should return team members', async () => {
      const result = await service.findMembers(1);
      expect(result).toHaveLength(2);
    });
  });

  describe('addMember', () => {
    it('should add member', async () => {
      mockTeamMemberRepository.findByUserAndTeam
        .mockResolvedValueOnce(mockOwner)
        .mockResolvedValueOnce(null);
      const result = await service.addMember(
        1,
        { userId: 20, teamRole: TeamRole.MEMBER },
        10,
        AccountRole.MEMBER,
      );
      expect(result.userId).toBe(20);
    });

    it('should reject duplicate member', async () => {
      mockTeamMemberRepository.findByUserAndTeam
        .mockResolvedValueOnce(mockOwner)
        .mockResolvedValueOnce(mockMember);
      await expect(
        service.addMember(1, { userId: 20, teamRole: TeamRole.MEMBER }, 10, AccountRole.MEMBER),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject non-existent user', async () => {
      mockTeamMemberRepository.findByUserAndTeam.mockResolvedValueOnce(mockOwner);
      mockUserRepository.findById.mockResolvedValueOnce(null);
      await expect(
        service.addMember(1, { userId: 999, teamRole: TeamRole.MEMBER }, 10, AccountRole.MEMBER),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateMember', () => {
    it('should update role', async () => {
      mockTeamMemberRepository.findAll.mockResolvedValueOnce([mockOwner, mockMember]);
      mockTeamMemberRepository.findByUserAndTeam.mockResolvedValueOnce(mockOwner);
      mockTeamMemberRepository.update.mockResolvedValueOnce({
        ...mockMember,
        teamRole: TeamRole.OBSERVER,
      });

      const result = await service.updateMember(
        2,
        { teamRole: TeamRole.OBSERVER },
        10,
        AccountRole.MEMBER,
      );
      expect(result.teamRole).toBe(TeamRole.OBSERVER);
    });
  });

  describe('removeMember', () => {
    it('should remove a non-owner member', async () => {
      mockTeamMemberRepository.findAll.mockResolvedValueOnce([mockOwner, mockMember]);
      mockTeamMemberRepository.findByUserAndTeam.mockResolvedValueOnce(mockOwner);
      mockProjectRepository.findByTeam.mockResolvedValueOnce([]);

      await service.removeMember(2, 10, AccountRole.MEMBER);
      expect(mockTeamMemberRepository.delete).toHaveBeenCalledWith(2);
    });

    it('should not remove the last owner', async () => {
      mockTeamMemberRepository.findAll.mockResolvedValueOnce([mockOwner, mockMember]);
      mockTeamMemberRepository.findByTeam.mockResolvedValueOnce([mockOwner]);

      await expect(
        service.removeMember(1, 10, AccountRole.ADMIN),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
