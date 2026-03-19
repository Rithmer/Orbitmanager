export interface RepositoryPageParams {
  page: number;
  limit: number;
  search?: string;
  sort?: string;
}

export interface RepositoryPageResult<T> {
  items: T[];
  total: number;
}
