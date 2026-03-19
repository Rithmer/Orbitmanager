import { QueryHelper, QueryParams } from './query.helper';

describe('QueryHelper', () => {
  const items = [
    { id: 1, name: 'Alpha Project', status: 'active', difficulty: 3 },
    { id: 2, name: 'Beta Service', status: 'completed', difficulty: 5 },
    { id: 3, name: 'Gamma Tool', status: 'active', difficulty: 1 },
    { id: 4, name: 'Delta App', status: 'on_hold', difficulty: 4 },
    { id: 5, name: 'Epsilon API', status: 'active', difficulty: 2 },
  ];

  describe('applyFilters', () => {
    it('should filter by exact field value', () => {
      const result = QueryHelper.applyFilters(items, { status: 'active' });
      expect(result).toHaveLength(3);
      expect(result.every((i) => i.status === 'active')).toBe(true);
    });

    it('should filter by multiple fields', () => {
      const result = QueryHelper.applyFilters(items, {
        status: 'active',
        difficulty: 3,
      });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alpha Project');
    });

    it('should ignore undefined filter values', () => {
      const result = QueryHelper.applyFilters(items, {
        status: undefined,
      });
      expect(result).toHaveLength(5);
    });
  });

  describe('applySearch', () => {
    it('should search case-insensitively', () => {
      const result = QueryHelper.applySearch(items, 'alpha', ['name']);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('should search across multiple fields', () => {
      const result = QueryHelper.applySearch(items, 'active', [
        'name',
        'status',
      ]);
      expect(result).toHaveLength(3);
    });

    it('should return empty for no matches', () => {
      const result = QueryHelper.applySearch(items, 'nonexistent', ['name']);
      expect(result).toHaveLength(0);
    });
  });

  describe('applySort', () => {
    it('should sort ascending by field name', () => {
      const result = QueryHelper.applySort(items, 'name');
      expect(result[0].name).toBe('Alpha Project');
      expect(result[4].name).toBe('Gamma Tool');
    });

    it('should sort descending with - prefix', () => {
      const result = QueryHelper.applySort(items, '-difficulty');
      expect(result[0].difficulty).toBe(5);
      expect(result[4].difficulty).toBe(1);
    });

    it('should sort numeric fields correctly', () => {
      const result = QueryHelper.applySort(items, 'id');
      expect(result.map((i) => i.id)).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('applyPagination', () => {
    it('should return first page with default limit', () => {
      const result = QueryHelper.applyPagination(items);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.total).toBe(5);
      expect(result.totalPages).toBe(1);
      expect(result.items).toHaveLength(5);
    });

    it('should paginate correctly', () => {
      const result = QueryHelper.applyPagination(items, 1, 2);
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(5);
      expect(result.totalPages).toBe(3);
    });

    it('should return second page', () => {
      const result = QueryHelper.applyPagination(items, 2, 2);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].id).toBe(3);
    });

    it('should cap limit at 100', () => {
      const result = QueryHelper.applyPagination(items, 1, 500);
      expect(result.limit).toBe(100);
    });

    it('should default page to 1 if invalid', () => {
      const result = QueryHelper.applyPagination(items, -5, 20);
      expect(result.page).toBe(1);
    });

    it('should fallback when page or limit is NaN', () => {
      const result = QueryHelper.applyPagination(items, Number.NaN, Number.NaN);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.items).toHaveLength(5);
    });
  });

  describe('apply (full pipeline)', () => {
    it('should apply filters + search + sort + pagination', () => {
      const params: QueryParams = {
        filters: { status: 'active' },
        search: 'a',
        searchFields: ['name'],
        sort: '-id',
        page: 1,
        limit: 2,
      };
      const result = QueryHelper.apply(items, params);
      expect(result.total).toBeGreaterThanOrEqual(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(2);
    });

    it('should handle empty params', () => {
      const result = QueryHelper.apply(items, {});
      expect(result.total).toBe(5);
      expect(result.items).toHaveLength(5);
    });
  });
});
