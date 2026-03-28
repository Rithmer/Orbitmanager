import { Test } from '@nestjs/testing';
import { TeamRole } from '@/common/enums/team-role.enum';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { TeamsListViewService } from './teams-list-view.service';

const makeTeamRecord = (overrides = {}) => ({
  id: 1,
  name: 'Team Alpha',
  description: 'Main development team',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  createdById: 5,
  _count: { members: 2 },
  members: [
    {
      id: 10,
      userId: 7,
      teamId: 1,
      teamRole: TeamRole.OWNER,
      user: {
        id: 7,
        login: 'alice',
        fullName: 'Alice Smith',
        profession: 'Developer',
      },
    },
    {
      id: 11,
      userId: 8,
      teamId: 1,
      teamRole: TeamRole.MEMBER,
      user: {
        id: 8,
        login: 'bob',
        fullName: 'Bob Jones',
        profession: 'Designer',
      },
    },
  ],
  ...overrides,
});

const mockPrisma = {
  team: {
    findMany: jest.fn().mockResolvedValue([makeTeamRecord()]),
    count: jest.fn().mockResolvedValue(1),
  },
};

async function buildService() {
  const module = await Test.createTestingModule({
    providers: [
      TeamsListViewService,
      { provide: PrismaService, useValue: mockPrisma },
    ],
  }).compile();

  return module.get(TeamsListViewService);
}

describe('TeamsListViewService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.team.findMany.mockResolvedValue([makeTeamRecord()]);
    mockPrisma.team.count.mockResolvedValue(1);
  });

  describe('getListView', () => {
    it('returns a paginated list of teams with mapped DTOs', async () => {
      const service = await buildService();
      const result = await service.getListView({}, 7);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.items[0].id).toBe(1);
      expect(result.items[0].name).toBe('Team Alpha');
      expect(result.items[0].memberCount).toBe(2);
    });

    it('populates currentUserRole based on the requesting userId', async () => {
      const service = await buildService();
      const result = await service.getListView({}, 7);

      // userId 7 is OWNER in the team record
      expect(result.items[0].currentUserRole).toBe(TeamRole.OWNER);
    });

    it('sets currentUserRole to null when the user is not a member of the team', async () => {
      const service = await buildService();
      const result = await service.getListView({}, 999);

      expect(result.items[0].currentUserRole).toBeNull();
    });

    it('returns an empty items list when no teams exist', async () => {
      mockPrisma.team.findMany.mockResolvedValue([]);
      mockPrisma.team.count.mockResolvedValue(0);

      const service = await buildService();
      const result = await service.getListView({}, 7);

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('maps members array to TeamListViewMemberDto correctly', async () => {
      const service = await buildService();
      const result = await service.getListView({}, 7);

      const member = result.items[0].members[0];
      expect(member).toMatchObject({
        id: 10,
        userId: 7,
        teamId: 1,
        teamRole: TeamRole.OWNER,
        user: {
          id: 7,
          login: 'alice',
          fullName: 'Alice Smith',
          profession: 'Developer',
        },
      });
    });

    it('passes default pagination when no page/limit params are given', async () => {
      const service = await buildService();
      const result = await service.getListView({}, 7);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('respects custom page and limit params', async () => {
      mockPrisma.team.findMany.mockResolvedValue([]);
      mockPrisma.team.count.mockResolvedValue(0);

      const service = await buildService();
      const result = await service.getListView({ page: 2, limit: 5 }, 7);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      // skip = (2-1)*5 = 5
      expect(mockPrisma.team.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5 }),
      );
    });
  });
});
