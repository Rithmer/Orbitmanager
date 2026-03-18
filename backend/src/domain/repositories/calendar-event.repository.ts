import { CalendarEvent } from '../models/calendar-event.model';

export interface ICalendarEventRepository {
  findAll(): Promise<CalendarEvent[]>;
  findById(id: number): Promise<CalendarEvent | null>;
  findByUser(userId: number): Promise<CalendarEvent[]>;
  findByProject(projectId: number): Promise<CalendarEvent[]>;
  findByTask(taskId: number): Promise<CalendarEvent[]>;
  findByDateRange(
    userId: number,
    startDate: string,
    endDate: string,
  ): Promise<CalendarEvent[]>;
  create(event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent>;
  update(
    id: number,
    partial: Partial<CalendarEvent>,
  ): Promise<CalendarEvent | null>;
  delete(id: number): Promise<boolean>;
}

export const CALENDAR_EVENT_REPOSITORY = Symbol('CALENDAR_EVENT_REPOSITORY');
