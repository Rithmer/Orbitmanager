import { CalendarEvent } from '../models/calendar-event.model';
import {
  RepositoryPageParams,
  RepositoryPageResult,
} from './paginated-query.types';

export interface CalendarEventListQuery extends RepositoryPageParams {
  userId?: number;
  projectId?: number;
  from?: string;
  to?: string;
}

export interface ICalendarEventRepository {
  findAll(): Promise<CalendarEvent[]>;
  findPage(
    params: CalendarEventListQuery,
  ): Promise<RepositoryPageResult<CalendarEvent>>;
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
