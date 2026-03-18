export interface PaginationParams {
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

export interface NormalizedPagination {
  page: number;
  limit: number;
  skip: number;
}

export type SortDirection = 'asc' | 'desc';

export function normalizePagination(
  page?: number,
  limit?: number,
): NormalizedPagination {
  const safePage = Math.max(1, page ?? 1);
  const safeLimit = Math.min(100, Math.max(1, limit ?? 20));

  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
  };
}

export function buildPaginatedResult<T>(
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

export function parseSortField<TField extends string>(
  sort: string | undefined,
  allowedFields: readonly TField[],
  defaultField: TField,
): { field: TField; direction: SortDirection } {
  if (!sort) {
    return { field: defaultField, direction: 'asc' };
  }

  const direction: SortDirection = sort.startsWith('-') ? 'desc' : 'asc';
  const rawField = (sort.startsWith('-') ? sort.slice(1) : sort) as TField;

  if (!allowedFields.includes(rawField)) {
    return { field: defaultField, direction: 'asc' };
  }

  return { field: rawField, direction };
}
