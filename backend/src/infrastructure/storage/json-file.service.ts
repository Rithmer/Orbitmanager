import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { join } from 'path';
import { readFile, writeFile, rename, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { randomUUID } from 'crypto';

export interface JsonFileMeta {
  entity: string;
  lastId: number;
}

export interface JsonFile<T> {
  meta: JsonFileMeta;
  items: T[];
}

@Injectable()
export class JsonFileService implements OnModuleInit {
  private readonly logger = new Logger(JsonFileService.name);
  private readonly dataDir = join(process.cwd(), 'data');
  private readonly cache = new Map<string, JsonFile<unknown>>();
  private readonly writeQueue = new Map<string, Promise<void>>();

  async onModuleInit(): Promise<void> {
    if (!existsSync(this.dataDir)) {
      await mkdir(this.dataDir, { recursive: true });
    }
  }

  async read<T>(entity: string): Promise<JsonFile<T>> {
    const cached = this.cache.get(entity);
    if (cached) {
      return cached as JsonFile<T>;
    }

    const filePath = this.getFilePath(entity);

    if (!existsSync(filePath)) {
      const empty: JsonFile<T> = {
        meta: { entity, lastId: 0 },
        items: [],
      };
      this.cache.set(entity, empty as JsonFile<unknown>);
      return empty;
    }

    const raw = await readFile(filePath, 'utf-8');
    const data = JSON.parse(raw) as JsonFile<T>;
    this.cache.set(entity, data as JsonFile<unknown>);
    return data;
  }

  async write<T>(entity: string, data: JsonFile<T>): Promise<void> {
    return this.enqueue(entity, async () => {
      await this.atomicWrite(entity, data);
    });
  }

  async create<T extends { id?: number }>(
    entity: string,
    item: Omit<T, 'id'>,
  ): Promise<T> {
    return this.enqueue(entity, async () => {
      const data = await this.readFresh<T>(entity);
      data.meta.lastId += 1;
      const newItem = { ...item, id: data.meta.lastId } as T;
      data.items.push(newItem);
      await this.atomicWrite(entity, data);
      return newItem;
    });
  }

  async update<T extends { id: number }>(
    entity: string,
    id: number,
    partial: Partial<T>,
  ): Promise<T | null> {
    return this.enqueue(entity, async () => {
      const data = await this.readFresh<T>(entity);
      const index = data.items.findIndex((item) => item.id === id);
      if (index === -1) return null;

      // Filter out undefined values to avoid overwriting existing fields
      const filtered = Object.fromEntries(
        Object.entries(partial as Record<string, unknown>).filter(
          ([, v]) => v !== undefined,
        ),
      );
      data.items[index] = { ...data.items[index], ...filtered };
      await this.atomicWrite(entity, data);
      return data.items[index];
    });
  }

  async remove<T extends { id: number }>(
    entity: string,
    id: number,
  ): Promise<boolean> {
    return this.enqueue(entity, async () => {
      const data = await this.readFresh<T>(entity);
      const index = data.items.findIndex((item) => item.id === id);
      if (index === -1) return false;

      data.items.splice(index, 1);
      await this.atomicWrite(entity, data);
      return true;
    });
  }

  invalidateCache(entity: string): void {
    this.cache.delete(entity);
  }

  clearCache(): void {
    this.cache.clear();
  }

  private getFilePath(entity: string): string {
    return join(this.dataDir, `${entity}.json`);
  }

  private async readFresh<T>(entity: string): Promise<JsonFile<T>> {
    this.cache.delete(entity);
    return this.read<T>(entity);
  }

  private async enqueue<R>(
    entity: string,
    fn: () => Promise<R>,
  ): Promise<R> {
    const pending = this.writeQueue.get(entity) ?? Promise.resolve();

    let resolve!: (value: R) => void;
    let reject!: (reason: unknown) => void;
    const resultPromise = new Promise<R>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    const next = pending.then(async () => {
      try {
        resolve(await fn());
      } catch (err) {
        reject(err);
      }
    });

    this.writeQueue.set(entity, next.then(() => undefined, () => undefined));

    return resultPromise;
  }

  private async atomicWrite<T>(
    entity: string,
    data: JsonFile<T>,
  ): Promise<void> {
    const filePath = this.getFilePath(entity);
    const tmpPath = join(this.dataDir, `${entity}-${randomUUID()}.json.tmp`);
    const json = JSON.stringify(data, null, 2);

    try {
      await writeFile(tmpPath, json, 'utf-8');
      await rename(tmpPath, filePath);
      this.cache.set(entity, data as JsonFile<unknown>);
      this.logger.debug(`Written ${entity}.json (${data.items.length} items)`);
    } catch (error) {
      this.logger.error(`Failed to write ${entity}.json`, error);
      try {
        const { unlink } = await import('fs/promises');
        await unlink(tmpPath);
      } catch {}
      throw error;
    }
  }
}
