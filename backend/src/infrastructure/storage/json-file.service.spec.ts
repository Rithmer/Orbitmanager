import { Test, TestingModule } from '@nestjs/testing';
import {
  JsonFileService,
  JsonFile,
} from './json-file.service';
import { join } from 'path';
import { writeFile, readFile, mkdir, rm } from 'fs/promises';
import { existsSync } from 'fs';

describe('JsonFileService', () => {
  let service: JsonFileService;
  const testDataDir = join(process.cwd(), 'data');
  const testEntity = 'test_entity';
  const testFilePath = join(testDataDir, `${testEntity}.json`);

  const emptyFile: JsonFile<{ id: number; name: string }> = {
    meta: { entity: testEntity, lastId: 0 },
    items: [],
  };

  beforeAll(async () => {
    if (!existsSync(testDataDir)) {
      await mkdir(testDataDir, { recursive: true });
    }
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JsonFileService],
    }).compile();

    service = module.get<JsonFileService>(JsonFileService);
    await service.onModuleInit();

    await writeFile(testFilePath, JSON.stringify(emptyFile, null, 2), 'utf-8');
    service.clearCache();
  });

  afterEach(async () => {
    try {
      if (existsSync(testFilePath)) {
        await rm(testFilePath);
      }
    } catch {}
  });

  describe('read', () => {
    it('should read an existing JSON file', async () => {
      const data = await service.read<{ id: number; name: string }>(
        testEntity,
      );
      expect(data.meta.entity).toBe(testEntity);
      expect(data.meta.lastId).toBe(0);
      expect(data.items).toEqual([]);
    });

    it('should return empty structure for non-existent entity', async () => {
      const data = await service.read<{ id: number }>('nonexistent_entity');
      expect(data.meta.entity).toBe('nonexistent_entity');
      expect(data.meta.lastId).toBe(0);
      expect(data.items).toEqual([]);
    });

    it('should cache results', async () => {
      const data1 = await service.read<{ id: number }>(testEntity);
      const data2 = await service.read<{ id: number }>(testEntity);
      expect(data1).toBe(data2); // same reference
    });
  });

  describe('write', () => {
    it('should write data atomically', async () => {
      const data: JsonFile<{ id: number; name: string }> = {
        meta: { entity: testEntity, lastId: 1 },
        items: [{ id: 1, name: 'Test' }],
      };
      await service.write(testEntity, data);

      const raw = await readFile(testFilePath, 'utf-8');
      const parsed = JSON.parse(raw) as JsonFile<{ id: number; name: string }>;
      expect(parsed.meta.lastId).toBe(1);
      expect(parsed.items).toHaveLength(1);
      expect(parsed.items[0].name).toBe('Test');
    });

    it('should update cache after write', async () => {
      const data: JsonFile<{ id: number; name: string }> = {
        meta: { entity: testEntity, lastId: 1 },
        items: [{ id: 1, name: 'Cached' }],
      };
      await service.write(testEntity, data);

      const cached = await service.read<{ id: number; name: string }>(
        testEntity,
      );
      expect(cached.items[0].name).toBe('Cached');
    });
  });

  describe('create', () => {
    it('should auto-increment lastId', async () => {
      const item1 = await service.create<{ id: number; name: string }>(
        testEntity,
        { name: 'First' },
      );
      expect(item1.id).toBe(1);

      const item2 = await service.create<{ id: number; name: string }>(
        testEntity,
        { name: 'Second' },
      );
      expect(item2.id).toBe(2);

      const data = await service.read<{ id: number; name: string }>(
        testEntity,
      );
      expect(data.meta.lastId).toBe(2);
      expect(data.items).toHaveLength(2);
    });
  });

  describe('update', () => {
    it('should update an existing item', async () => {
      await service.create<{ id: number; name: string }>(testEntity, {
        name: 'Original',
      });
      const updated = await service.update<{ id: number; name: string }>(
        testEntity,
        1,
        { name: 'Updated' },
      );
      expect(updated?.name).toBe('Updated');
    });

    it('should return null for non-existent id', async () => {
      const result = await service.update<{ id: number; name: string }>(
        testEntity,
        999,
        { name: 'Nope' },
      );
      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('should remove an existing item', async () => {
      await service.create<{ id: number; name: string }>(testEntity, {
        name: 'ToRemove',
      });
      const removed = await service.remove<{ id: number; name: string }>(
        testEntity,
        1,
      );
      expect(removed).toBe(true);

      const data = await service.read<{ id: number; name: string }>(
        testEntity,
      );
      expect(data.items).toHaveLength(0);
    });

    it('should return false for non-existent id', async () => {
      const result = await service.remove<{ id: number }>(testEntity, 999);
      expect(result).toBe(false);
    });
  });

  describe('cache management', () => {
    it('should invalidate specific entity cache', async () => {
      await service.read(testEntity);
      service.invalidateCache(testEntity);

      const data: JsonFile<{ id: number; name: string }> = {
        meta: { entity: testEntity, lastId: 5 },
        items: [{ id: 5, name: 'Direct' }],
      };
      await writeFile(testFilePath, JSON.stringify(data, null, 2), 'utf-8');

      const fresh = await service.read<{ id: number; name: string }>(
        testEntity,
      );
      expect(fresh.meta.lastId).toBe(5);
    });
  });

  describe('sequential writes', () => {
    it('should handle multiple concurrent writes sequentially', async () => {
      const writes = Array.from({ length: 5 }, (_, i) =>
        service.create<{ id: number; name: string }>(testEntity, {
          name: `Item ${i + 1}`,
        }),
      );

      const results = await Promise.all(writes);
      const ids = results.map((r) => r.id);
      expect(new Set(ids).size).toBe(5);

      const data = await service.read<{ id: number; name: string }>(
        testEntity,
      );
      expect(data.items).toHaveLength(5);
      expect(data.meta.lastId).toBe(5);
    });
  });
});
