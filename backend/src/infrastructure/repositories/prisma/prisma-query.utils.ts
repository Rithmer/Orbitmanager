export function normalizePage(page: number | undefined): number {
  if (!Number.isFinite(page)) {
    return 1;
  }

  return Math.max(1, Math.trunc(page as number));
}

export function normalizeLimit(limit: number | undefined): number {
  if (!Number.isFinite(limit)) {
    return 20;
  }

  return Math.min(100, Math.max(1, Math.trunc(limit as number)));
}

export function getPagination(
  page: number | undefined,
  limit: number | undefined,
) {
  const safePage = normalizePage(page);
  const safeLimit = normalizeLimit(limit);

  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
    take: safeLimit,
  };
}

export function buildOrderBy(
  sort: string | undefined,
  allowedFields: readonly string[],
  fallbackField: string,
): Record<string, 'asc' | 'desc'> {
  if (!sort) {
    return { [fallbackField]: 'asc' };
  }

  const isDesc = sort.startsWith('-');
  const field = isDesc ? sort.slice(1) : sort;
  if (!allowedFields.includes(field)) {
    return { [fallbackField]: 'asc' };
  }

  return { [field]: isDesc ? 'desc' : 'asc' };
}

export function buildStringSearch(
  search: string | undefined,
  fields: readonly string[],
) {
  if (!search?.trim()) {
    return undefined;
  }

  return {
    OR: fields.map((field) => ({
      [field]: {
        contains: search.trim(),
        mode: 'insensitive' as const,
      },
    })),
  };
}
