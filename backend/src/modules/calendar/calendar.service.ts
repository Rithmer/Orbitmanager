import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { AccountRole } from '@/common/enums/account-role.enum';
import { AuditAction } from '@/common/enums/audit-action.enum';
import { PaginatedResult, QueryParams } from '@/common/helpers/query.helper';
import { CalendarEvent } from '@/domain/models/calendar-event.model';
import type { ICalendarEventRepository } from '@/domain/repositories/calendar-event.repository';
import { CALENDAR_EVENT_REPOSITORY } from '@/domain/repositories/calendar-event.repository';
import type { IProjectRepository } from '@/domain/repositories/project.repository';
import { PROJECT_REPOSITORY } from '@/domain/repositories/project.repository';
import type { ITaskRepository } from '@/domain/repositories/task.repository';
import { TASK_REPOSITORY } from '@/domain/repositories/task.repository';
import { AuditService } from '../audit-logs/audit.service';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';

@Injectable()
export class CalendarService {
  constructor(
    @Inject(CALENDAR_EVENT_REPOSITORY)
    private readonly calendarEventRepository: ICalendarEventRepository,
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: IProjectRepository,
    @Inject(TASK_REPOSITORY)
    private readonly taskRepository: ITaskRepository,
    private readonly auditService: AuditService,
  ) {}

  private async validateLinkedResources(
    dto: CreateCalendarEventDto,
  ): Promise<void> {
    if (dto.projectId) {
      const project = await this.projectRepository.findById(dto.projectId);
      if (!project) {
        throw new NotFoundException(`Проект #${dto.projectId} не найден`);
      }
    }

    if (dto.taskId) {
      const task = await this.taskRepository.findById(dto.taskId);
      if (!task) {
        throw new NotFoundException(`Задача #${dto.taskId} не найдена`);
      }

      if (task.projectId && dto.projectId && task.projectId !== dto.projectId) {
        throw new BadRequestException(
          'Задача не принадлежит указанному проекту',
        );
      }
    }
  }

  async findAll(
    params: QueryParams,
    userId: number,
    userRole: AccountRole,
    filters?: { projectId?: number; from?: string; to?: string },
  ): Promise<PaginatedResult<CalendarEvent>> {
    const page = normalizePage(params.page);
    const limit = normalizeLimit(params.limit);

    if (this.calendarEventRepository.findPage) {
      const result = await this.calendarEventRepository.findPage({
        page,
        limit,
        search: params.search,
        sort: params.sort,
        userId: userRole === AccountRole.ADMIN ? undefined : userId,
        projectId: filters?.projectId,
        from: filters?.from,
        to: filters?.to,
      });

      return toPaginatedResult(result.items, result.total, page, limit);
    }

    let events: CalendarEvent[];

    if (filters?.from && filters?.to) {
      const targetUserId = userRole === AccountRole.ADMIN ? 0 : userId;
      if (targetUserId === 0) {
        events = await this.calendarEventRepository.findAll();
        events = events.filter(
          (e) => e.startDate <= filters.to! && e.endDate >= filters.from!,
        );
      } else {
        events = await this.calendarEventRepository.findByDateRange(
          userId,
          filters.from,
          filters.to,
        );
      }
    } else if (userRole === AccountRole.ADMIN) {
      events = await this.calendarEventRepository.findAll();
    } else {
      events = await this.calendarEventRepository.findByUser(userId);
    }

    if (filters?.projectId) {
      events = events.filter((e) => e.projectId === filters.projectId);
    }

    return applyInMemoryPagination(
      events.filter((event) => {
        if (!params.search) {
          return true;
        }

        const search = params.search.toLowerCase();
        return [event.title, event.description].some((field) =>
          field.toLowerCase().includes(search),
        );
      }),
      page,
      limit,
    );
  }

  async findById(
    id: number,
    userId: number,
    userRole: AccountRole,
  ): Promise<CalendarEvent> {
    const event = await this.calendarEventRepository.findById(id);
    if (!event) {
      throw new NotFoundException(`Событие #${id} не найдено`);
    }

    if (userRole !== AccountRole.ADMIN && event.userId !== userId) {
      throw new ForbiddenException('Нет доступа к этому событию');
    }

    return event;
  }

  async create(
    dto: CreateCalendarEventDto,
    userId: number,
    _userRole: AccountRole,
  ): Promise<CalendarEvent> {
    await this.validateLinkedResources(dto);

    if (new Date(dto.endDate) <= new Date(dto.startDate)) {
      throw new BadRequestException(
        'Дата окончания должна быть позже даты начала',
      );
    }

    const now = new Date().toISOString();
    const event = await this.calendarEventRepository.create({
      userId,
      projectId: dto.projectId ?? null,
      taskId: dto.taskId ?? null,
      title: dto.title,
      description: dto.description ?? '',
      startDate: dto.startDate,
      endDate: dto.endDate,
      allDay: dto.allDay ?? false,
      color: dto.color ?? '#3b82f6',
      createdAt: now,
      updatedAt: now,
    });

    await this.auditService.log(
      userId,
      AuditAction.CREATE,
      'calendar_event',
      event.id,
      `Создано событие "${event.title}"`,
    );

    return event;
  }

  async update(
    id: number,
    dto: UpdateCalendarEventDto,
    userId: number,
    userRole: AccountRole,
  ): Promise<CalendarEvent> {
    const existing = await this.findById(id, userId, userRole);

    if (dto.startDate && dto.endDate) {
      if (new Date(dto.endDate) <= new Date(dto.startDate)) {
        throw new BadRequestException(
          'Дата окончания должна быть позже даты начала',
        );
      }
    } else if (
      dto.endDate &&
      new Date(dto.endDate) <= new Date(existing.startDate)
    ) {
      throw new BadRequestException(
        'Дата окончания должна быть позже даты начала',
      );
    } else if (
      dto.startDate &&
      new Date(existing.endDate) <= new Date(dto.startDate)
    ) {
      throw new BadRequestException(
        'Дата окончания должна быть позже даты начала',
      );
    }

    const updated = await this.calendarEventRepository.update(id, {
      ...dto,
      updatedAt: new Date().toISOString(),
    });
    if (!updated) {
      throw new NotFoundException(`Событие #${id} не найдено`);
    }

    await this.auditService.log(
      userId,
      AuditAction.UPDATE,
      'calendar_event',
      id,
      `Обновлено событие "${updated.title}"`,
    );

    return updated;
  }

  async remove(
    id: number,
    userId: number,
    userRole: AccountRole,
  ): Promise<void> {
    const event = await this.findById(id, userId, userRole);
    await this.calendarEventRepository.delete(id);

    await this.auditService.log(
      userId,
      AuditAction.DELETE,
      'calendar_event',
      id,
      `Удалено событие "${event.title}"`,
    );
  }
}

function normalizePage(page: number | undefined): number {
  if (!Number.isFinite(page)) {
    return 1;
  }

  return Math.max(1, Math.trunc(page as number));
}

function normalizeLimit(limit: number | undefined): number {
  if (!Number.isFinite(limit)) {
    return 20;
  }

  return Math.min(100, Math.max(1, Math.trunc(limit as number)));
}

function toPaginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

function applyInMemoryPagination<T>(
  items: T[],
  page: number,
  limit: number,
): PaginatedResult<T> {
  const offset = (page - 1) * limit;
  return toPaginatedResult(
    items.slice(offset, offset + limit),
    items.length,
    page,
    limit,
  );
}
