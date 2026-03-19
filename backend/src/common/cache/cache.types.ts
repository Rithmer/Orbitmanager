export interface CacheSetOptions {
  ttlMs?: number;
}

export interface CacheEntry<T> {
  value: T;
  expiresAt: number | null;
}
