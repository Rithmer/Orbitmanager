import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import type {
  CalendarEventListQuery,
  ICalendarEventRepository,
} from '@/domain/repositories/calendar-event.repository';
import { CalendarEvent } from '@/domain/models/calendar-event.model';
import type { CalendarEvent as PrismaCalendarEvent } from '@prisma/client';
import { buildOrderBy, buildStringSearch, getPagination } from './prisma-query.utils';

@Injectable()
export class CalendarEventsPrismaRepository implements ICalendarEventRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<CalendarEvent[]> {
    const rows = await this.prisma.calendarEvent.findMany({
      orderBy: { startDate: 'asc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findPage(params: CalendarEventListQuery) {
    const { skip, take } = getPagination(params.page, params.limit);
    const where = {
      ...(params.userId !== undefined ? { userId: params.userId } : {}),
      ...(params.projectId !== undefined ? { projectId: params.projectId } : {}),
      ...(params.from || params.to
        ? {
            startDate: {
              ...(params.to ? { lte: new Date(params.to) } : {}),
            },
            endDate: {
              ...(params.from ? { gte: new Date(params.from) } : {}),
            },
          }
        : {}),
      ...buildStringSearch(params.search, ['title', 'description']),
    };

    const [rows, total] = await Promise.all([
      this.prisma.calendarEvent.findMany({
        where,
        orderBy: buildOrderBy(
          params.sort,
          ['id', 'userId', 'projectId', 'taskId', 'title', 'startDate', 'endDate', 'createdAt', 'updatedAt'],
          'startDate',
        ),
        skip,
        take,
      }),
      this.prisma.calendarEvent.count({ where }),
    ]);

    return {
      items: rows.map((row) => this.toDomain(row)),
      total,
    };
  }

  async findById(id: number): Promise<CalendarEvent | null> {
    const row = await this.prisma.calendarEvent.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByUser(userId: number): Promise<CalendarEvent[]> {
    const rows = await this.prisma.calendarEvent.findMany({
      where: { userId },
      orderBy: { startDate: 'asc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findByProject(projectId: number): Promise<CalendarEvent[]> {
    const rows = await this.prisma.calendarEvent.findMany({
      where: { projectId },
      orderBy: { startDate: 'asc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findByTask(taskId: number): Promise<CalendarEvent[]> {
    const rows = await this.prisma.calendarEvent.findMany({
      where: { taskId },
      orderBy: { startDate: 'asc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findByDateRange(
    userId: number,
    startDate: string,
    endDate: string,
  ): Promise<CalendarEvent[]> {
    const rows = await this.prisma.calendarEvent.findMany({
      where: {
        userId,
        startDate: { lte: new Date(endDate) },
        endDate: { gte: new Date(startDate) },
      },
      orderBy: { startDate: 'asc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async create(event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
    const row = await this.prisma.calendarEvent.create({
      data: {
        userId: event.userId,
        projectId: event.projectId,
        taskId: event.taskId,
        title: event.title,
        description: event.description,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
        allDay: event.allDay,
        color: event.color,
      },
    });
    return this.toDomain(row);
  }

  async update(
    id: number,
    partial: Partial<CalendarEvent>,
  ): Promise<CalendarEvent | null> {
    const data: Record<string, unknown> = {};
    if (partial.title !== undefined) data['title'] = partial.title;
    if (partial.description !== undefined)
      data['description'] = partial.description;
    if (partial.startDate !== undefined)
      data['startDate'] = new Date(partial.startDate);
    if (partial.endDate !== undefined)
      data['endDate'] = new Date(partial.endDate);
    if (partial.allDay !== undefined) data['allDay'] = partial.allDay;
    if (partial.color !== undefined) data['color'] = partial.color;
    if (partial.projectId !== undefined) data['projectId'] = partial.projectId;
    if (partial.taskId !== undefined) data['taskId'] = partial.taskId;

    try {
      const row = await this.prisma.calendarEvent.update({
        where: { id },
        data,
      });
      return this.toDomain(row);
    } catch (e: unknown) {
      const prismaError = e as { code?: string };
      if (prismaError.code === 'P2025') return null;
      throw e;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      await this.prisma.calendarEvent.delete({ where: { id } });
      return true;
    } catch (e: unknown) {
      const prismaError = e as { code?: string };
      if (prismaError.code === 'P2025') return false;
      throw e;
    }
  }

  private toDomain(row: PrismaCalendarEvent): CalendarEvent {
    return {
      id: row.id,
      userId: row.userId,
      projectId: row.projectId,
      taskId: row.taskId,
      title: row.title,
      description: row.description,
      startDate: row.startDate.toISOString(),
      endDate: row.endDate.toISOString(),
      allDay: row.allDay,
      color: row.color,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
