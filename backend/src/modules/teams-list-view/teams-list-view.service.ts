import { Injectable } from '@nestjs/common';
import { TeamRole } from '@/common/enums/team-role.enum';
import { normalizePagination, buildPaginatedResult } from '@/common/query/pagination';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { buildOrderBy } from '@/infrastructure/repositories/prisma/prisma-query.utils';
import type {
  TeamListViewItemDto,
  TeamListViewMemberDto,
  TeamsListViewQueryParams,
  TeamsListViewResponseDto,
} from './teams-list-view.types';

type TeamRecord = {
  id: number;
  name: string;
  description: string;
  createdAt: Date;
  createdById: number;
  _count: {
    members: number;
  };
  members: Array<{
    id: number;
    userId: number;
    teamId: number;
    teamRole: string;
    user: {
      id: number;
      login: string;
      fullName: string;
      profession: string;
    };
  }>;
};

/**
 * @architecture CQRS Query Service
 *
 * Сервис агрегированного чтения данных. Использует PrismaService напрямую —
 * намеренное архитектурное решение: запросы включают сложные агрегации
 * (count, groupBy, многотабличные JOIN), которые не выражаются через
 * CRUD-репозитории без значительного усложнения их интерфейсов.
 *
 * Паттерн: CQRS-light — command-сервисы (TasksService, ProjectsService и др.)
 * работают через репозитории; query-сервисы (этот класс) обращаются к БД
 * напрямую для оптимальных read-path запросов.
 */
@Injectable()
export class TeamsListViewService {
  constructor(private readonly prisma: PrismaService) {}

  async getListView(
    params: TeamsListViewQueryParams,
    userId: number,
  ): Promise<TeamsListViewResponseDto> {
    const { page, limit, skip } = normalizePagination(params.page, params.limit);
    const search = params.search?.trim();
    const where = buildTeamsWhere(search);

    const [records, total] = await Promise.all([
      this.prisma.team.findMany({
        where,
        orderBy: buildOrderBy(
          params.sort,
          ['id', 'name', 'description', 'createdAt', 'createdById'],
          'id',
        ),
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          createdById: true,
          _count: {
            select: {
              members: true,
            },
          },
          members: {
            orderBy: { id: 'asc' },
            select: {
              id: true,
              userId: true,
              teamId: true,
              teamRole: true,
              user: {
                select: {
                  id: true,
                  login: true,
                  fullName: true,
                  profession: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.team.count({ where }),
    ]);

    return buildPaginatedResult(
      records.map((record) => this.toTeamListViewItem(record, userId)),
      total,
      page,
      limit,
    );
  }

  private toTeamListViewItem(
    record: TeamRecord,
    userId: number,
  ): TeamListViewItemDto {
    const members = record.members.map((member) => this.toTeamListViewMember(member));
    const currentUserRole =
      members.find((member) => member.userId === userId)?.teamRole ?? null;

    return {
      id: record.id,
      name: record.name,
      description: record.description,
      createdAt: record.createdAt.toISOString(),
      createdById: record.createdById,
      memberCount: record._count.members,
      currentUserRole,
      members,
    };
  }

  private toTeamListViewMember(
    member: TeamRecord['members'][number],
  ): TeamListViewMemberDto {
    return {
      id: member.id,
      userId: member.userId,
      teamId: member.teamId,
      teamRole: member.teamRole as TeamRole,
      user: {
        id: member.user.id,
        login: member.user.login,
        fullName: member.user.fullName,
        profession: member.user.profession,
      },
    };
  }
}

function buildTeamsWhere(search?: string) {
  if (!search) {
    return {};
  }

  return {
    OR: [
      {
        name: {
          contains: search,
          mode: 'insensitive' as const,
        },
      },
      {
        description: {
          contains: search,
          mode: 'insensitive' as const,
        },
      },
      {
        members: {
          some: {
            user: {
              OR: [
                {
                  login: {
                    contains: search,
                    mode: 'insensitive' as const,
                  },
                },
                {
                  fullName: {
                    contains: search,
                    mode: 'insensitive' as const,
                  },
                },
                {
                  profession: {
                    contains: search,
                    mode: 'insensitive' as const,
                  },
                },
              ],
            },
          },
        },
      },
    ],
  };
}
