import { Injectable } from '@nestjs/common';
import type { CacheEntry, CacheSetOptions } from './cache.types';

@Injectable()
export class InMemoryCacheService {
  private readonly entries = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) {
      return undefined;
    }

    if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T, options: CacheSetOptions = {}): T {
    const expiresAt =
      options.ttlMs === undefined
        ? null
        : options.ttlMs <= 0
          ? Date.now()
          : Date.now() + options.ttlMs;

    this.entries.set(key, { value, expiresAt });
    return value;
  }

  async remember<T>(
    key: string,
    loader: () => T | Promise<T>,
    options: CacheSetOptions = {},
  ): Promise<T> {
    const cachedValue = this.get<T>(key);
    if (cachedValue !== undefined) {
      return cachedValue;
    }

    const loadedValue = await loader();
    return this.set(key, loadedValue, options);
  }

  delete(key: string): boolean {
    return this.entries.delete(key);
  }

  clear(): void {
    this.entries.clear();
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }
}
