import { Injectable } from '@nestjs/common';
import {
  buildPaginatedResult,
  type PaginatedResult,
} from '@/common/query/pagination';

@Injectable()
export class ReadModelResponseFactory {
  normalizeIds(ids?: string | string[] | number[]): number[] {
    if (ids === undefined) {
      return [];
    }

    const rawValues = Array.isArray(ids) ? ids : [ids];
    const normalizedIds = new Set<number>();

    for (const rawValue of rawValues) {
      const chunks = String(rawValue)
        .split(',')
        .map((chunk) => chunk.trim())
        .filter(Boolean);

      for (const chunk of chunks) {
        const parsedId = Number(chunk);
        if (Number.isInteger(parsedId) && parsedId > 0) {
          normalizedIds.add(parsedId);
        }
      }
    }

    return [...normalizedIds];
  }

  toPaginatedResponse<T>(
    items: T[],
    total: number,
    page: number,
    limit: number,
  ): PaginatedResult<T> {
    return buildPaginatedResult(items, total, page, limit);
  }

  toRecordById<T extends { id: number }>(items: readonly T[]): Record<number, T> {
    const record: Record<number, T> = {};

    for (const item of items) {
      record[item.id] = item;
    }

    return record;
  }

  groupByNumberKey<T>(
    items: readonly T[],
    getKey: (item: T) => number,
  ): Record<number, T[]> {
    const groupedRecord: Record<number, T[]> = {};

    for (const item of items) {
      const key = getKey(item);
      const bucket = groupedRecord[key] ?? [];
      bucket.push(item);
      groupedRecord[key] = bucket;
    }

    return groupedRecord;
  }

  pickGroupedByIds<T>(
    groupedRecord: Record<number, T[]>,
    ids: readonly number[],
  ): Record<number, T[]> {
    const selectedRecord: Record<number, T[]> = {};

    for (const id of ids) {
      selectedRecord[id] = groupedRecord[id] ?? [];
    }

    return selectedRecord;
  }

  pickRecordByIds<T>(
    record: Record<number, T>,
    ids: readonly number[],
  ): Partial<Record<number, T>> {
    const selectedRecord: Partial<Record<number, T>> = {};

    for (const id of ids) {
      const value = record[id];
      if (value !== undefined) {
        selectedRecord[id] = value;
      }
    }

    return selectedRecord;
  }
}
