import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { AccountRole } from '@/common/enums/account-role.enum';
import { AuditAction } from '@/common/enums/audit-action.enum';
import {
  type PaginatedResult,
  QueryHelper,
  type QueryParams,
} from '@/common/helpers/query.helper';
import { CalendarEvent } from '@/domain/models/calendar-event.model';
import type { ICalendarEventRepository } from '@/domain/repositories/calendar-event.repository';
import { CALENDAR_EVENT_REPOSITORY } from '@/domain/repositories/calendar-event.repository';
import { AuditService } from '../audit-logs/audit.service';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';

@Injectable()
export class CalendarService {
  constructor(
    @Inject(CALENDAR_EVENT_REPOSITORY)
    private readonly calendarEventRepository: ICalendarEventRepository,
    private readonly auditService: AuditService,
  ) {}

  async findAll(
    params: QueryParams,
    userId: number,
    userRole: AccountRole,
    filters?: { projectId?: number; from?: string; to?: string },
  ): Promise<PaginatedResult<CalendarEvent>> {
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

    return QueryHelper.apply(events, {
      ...params,
      searchFields: params.searchFields ?? ['title', 'description'],
    });
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
  ): Promise<CalendarEvent> {
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
