export interface QueryParams {
  search?: string;
  searchFields?: string[];
  filters?: Record<string, unknown>;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class QueryHelper {
  static apply<T extends object>(
    items: T[],
    params: QueryParams,
  ): PaginatedResult<T> {
    let result = [...items];

    if (params.filters) {
      result = QueryHelper.applyFilters(result, params.filters);
    }

    if (params.search && params.searchFields?.length) {
      result = QueryHelper.applySearch(
        result,
        params.search,
        params.searchFields,
      );
    }

    if (params.sort) {
      result = QueryHelper.applySort(result, params.sort);
    }

    return QueryHelper.applyPagination(result, params.page, params.limit);
  }

  static applyFilters<T extends object>(
    items: T[],
    filters: Record<string, unknown>,
  ): T[] {
    return items.filter((item) =>
      Object.entries(filters).every(([key, value]) => {
        if (value === undefined || value === null) {
          return true;
        }

        const itemValue = QueryHelper.getFieldValue(item, key);
        return (
          QueryHelper.serializeValue(itemValue) ===
          QueryHelper.serializeValue(value)
        );
      }),
    );
  }

  static applySearch<T extends object>(
    items: T[],
    search: string,
    fields: string[],
  ): T[] {
    const lower = search.toLowerCase();
    return items.filter((item) =>
      fields.some((field) => {
        const value = QueryHelper.toSearchableValue(
          QueryHelper.getFieldValue(item, field),
        );
        return value ? value.includes(lower) : false;
      }),
    );
  }

  static applySort<T extends object>(items: T[], sort: string): T[] {
    const desc = sort.startsWith('-');
    const field = desc ? sort.slice(1) : sort;

    return [...items].sort((a, b) => {
      const aVal = QueryHelper.toSortableValue(
        QueryHelper.getFieldValue(a, field),
      );
      const bVal = QueryHelper.toSortableValue(
        QueryHelper.getFieldValue(b, field),
      );

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      let comparison: number;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
        comparison = Number(aVal) - Number(bVal);
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return desc ? -comparison : comparison;
    });
  }

  static applyPagination<T>(
    items: T[],
    page?: number,
    limit?: number,
  ): PaginatedResult<T> {
    const safePage = Math.max(1, page ?? 1);
    const safeLimit = Math.min(100, Math.max(1, limit ?? 20));
    const total = items.length;
    const totalPages = Math.ceil(total / safeLimit) || 1;
    const offset = (safePage - 1) * safeLimit;

    return {
      items: items.slice(offset, offset + safeLimit),
      total,
      page: safePage,
      limit: safeLimit,
      totalPages,
    };
  }

  private static getFieldValue<T extends object>(
    item: T,
    field: string,
  ): unknown {
    return (item as Record<string, unknown>)[field];
  }

  private static serializeValue(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    switch (typeof value) {
      case 'string':
        return value;
      case 'number':
      case 'boolean':
        return String(value);
      default:
        return null;
    }
  }

  private static toSearchableValue(value: unknown): string | null {
    const serialized = QueryHelper.serializeValue(value);
    return serialized ? serialized.toLowerCase() : null;
  }

  private static toSortableValue(
    value: unknown,
  ): string | number | boolean | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (value instanceof Date) {
      return value.getTime();
    }

    switch (typeof value) {
      case 'string':
      case 'number':
      case 'boolean':
        return value;
      default:
        return null;
    }
  }
}
