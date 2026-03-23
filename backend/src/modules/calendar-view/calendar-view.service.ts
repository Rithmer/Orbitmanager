import { Injectable, NotFoundException } from '@nestjs/common';
import { AccountRole } from '@/common/enums/account-role.enum';
import { ProjectStatus } from '@/common/enums/project-status.enum';
import { ProjectAccessService } from '@/common/access/project-access.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import type {
  CalendarMonthViewResponseDto,
  CalendarViewEventDto,
  CalendarViewProjectDto,
  CalendarViewTaskDto,
} from './calendar-view.types';

type CalendarProjectRecord = {
  id: number;
  name: string;
  teamId: number;
};

type CalendarTaskRecord = {
  id: number;
  projectId: number;
  name: string;
  description: string;
  deadline: Date;
  status: string;
  difficulty: number;
  project: {
    id: number;
    name: string;
  };
};

type CalendarEventRecord = {
  id: number;
  userId: number;
  projectId: number | null;
  taskId: number | null;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  color: string;
  project: {
    id: number;
    name: string;
  } | null;
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
export class CalendarViewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  async getMonthView(
    year: number,
    month: number,
    userId: number,
    accountRole: AccountRole,
    projectId?: number,
  ): Promise<CalendarMonthViewResponseDto> {
    const normalizedYear = Number.isFinite(year) ? year : new Date().getFullYear();
    const normalizedMonth = clampMonth(month);
    const { monthStart, nextMonthStart } = getMonthRange(
      normalizedYear,
      normalizedMonth,
    );

    const visibleProjectIds =
      accountRole === AccountRole.ADMIN
        ? undefined
        : await this.projectAccessService.getVisibleProjectIds(userId);

    if (projectId !== undefined && accountRole !== AccountRole.ADMIN) {
      await this.assertProjectVisible(projectId, userId);
    }

    const projectsPromise =
      accountRole === AccountRole.ADMIN
        ? this.prisma.project.findMany({
            orderBy: [{ name: 'asc' }, { id: 'asc' }],
            select: {
              id: true,
              name: true,
              teamId: true,
            },
          })
        : this.prisma.project.findMany({
            where: {
              id: { in: visibleProjectIds ?? [] },
            },
            orderBy: [{ name: 'asc' }, { id: 'asc' }],
            select: {
              id: true,
              name: true,
              teamId: true,
            },
          });

    const tasksPromise = this.prisma.task.findMany({
      where: {
        ...(projectId !== undefined ? { projectId } : {}),
        ...(visibleProjectIds ? { projectId: { in: visibleProjectIds } } : {}),
        deadline: {
          gte: monthStart,
          lt: nextMonthStart,
        },
      },
      orderBy: [{ deadline: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        projectId: true,
        name: true,
        description: true,
        deadline: true,
        status: true,
        difficulty: true,
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const eventsPromise = this.prisma.calendarEvent.findMany({
      where: {
        ...(accountRole === AccountRole.ADMIN ? {} : { userId }),
        ...(projectId !== undefined ? { projectId } : {}),
        startDate: {
          gte: monthStart,
          lt: nextMonthStart,
        },
      },
      orderBy: [{ startDate: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        userId: true,
        projectId: true,
        taskId: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        allDay: true,
        color: true,
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const [projects, tasks, events] = await Promise.all([
      projectsPromise,
      tasksPromise,
      eventsPromise,
    ]);

    return {
      year: normalizedYear,
      month: normalizedMonth,
      projects: projects.map((project) => this.toProjectDto(project)),
      tasks: tasks.map((task) => this.toTaskDto(task)),
      events: events.map((event) => this.toEventDto(event)),
    };
  }

  private async assertProjectVisible(
    projectId: number,
    userId: number,
  ): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        teamId: true,
        name: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!project) {
      throw new NotFoundException(`Проект #${projectId} не найден`);
    }

    await this.projectAccessService.assertProjectVisibility(
      {
        id: project.id,
        teamId: project.teamId,
        name: project.name,
        description: project.description,
        status: project.status as ProjectStatus,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
      },
      userId,
    );
  }

  private toProjectDto(
    project: CalendarProjectRecord,
  ): CalendarViewProjectDto {
    return {
      id: project.id,
      name: project.name,
      teamId: project.teamId,
    };
  }

  private toTaskDto(task: CalendarTaskRecord): CalendarViewTaskDto {
    return {
      id: task.id,
      projectId: task.projectId,
      projectName: task.project.name,
      name: task.name,
      description: task.description,
      deadline: task.deadline.toISOString(),
      status: task.status,
      difficulty: task.difficulty,
    };
  }

  private toEventDto(event: CalendarEventRecord): CalendarViewEventDto {
    return {
      id: event.id,
      userId: event.userId,
      projectId: event.projectId,
      projectName: event.project?.name ?? null,
      taskId: event.taskId,
      title: event.title,
      description: event.description,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      allDay: event.allDay,
      color: event.color,
    };
  }
}

function getMonthRange(year: number, month: number) {
  return {
    monthStart: new Date(year, month - 1, 1),
    nextMonthStart: new Date(year, month, 1),
  };
}

function clampMonth(month: number): number {
  if (!Number.isFinite(month)) {
    return new Date().getMonth() + 1;
  }

  return Math.min(12, Math.max(1, Math.trunc(month)));
}
