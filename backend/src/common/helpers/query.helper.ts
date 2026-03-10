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
  static apply<T extends Record<string, unknown>>(
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

  static applyFilters<T extends Record<string, unknown>>(
    items: T[],
    filters: Record<string, unknown>,
  ): T[] {
    return items.filter((item) =>
      Object.entries(filters).every(([key, value]) => {
        if (value === undefined || value === null) return true;
        return String(item[key]) === String(value);
      }),
    );
  }

  static applySearch<T extends Record<string, unknown>>(
    items: T[],
    search: string,
    fields: string[],
  ): T[] {
    const lower = search.toLowerCase();
    return items.filter((item) =>
      fields.some((field) => {
        const value = item[field];
        if (value === undefined || value === null) return false;
        return String(value).toLowerCase().includes(lower);
      }),
    );
  }

  static applySort<T extends Record<string, unknown>>(
    items: T[],
    sort: string,
  ): T[] {
    const desc = sort.startsWith('-');
    const field = desc ? sort.slice(1) : sort;

    return [...items].sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      let comparison: number;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
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
}
