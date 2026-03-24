import { TtlCacheService } from './ttl-cache.service';

describe('TtlCacheService', () => {
  let service: TtlCacheService;

  beforeEach(() => {
    service = new TtlCacheService();
  });

  afterEach(() => {
    service.onModuleDestroy();
    jest.restoreAllMocks();
  });

  it('stores and returns value before expiry', () => {
    const nowSpy = jest.spyOn(Date, 'now');
    nowSpy.mockReturnValue(1_000);

    service.set('key', 'value', 100);
    nowSpy.mockReturnValue(1_050);

    expect(service.get('key')).toBe('value');
  });

  it('returns undefined and removes value after expiry', () => {
    const nowSpy = jest.spyOn(Date, 'now');
    nowSpy.mockReturnValue(2_000);

    service.set('key', 'value', 100);
    nowSpy.mockReturnValue(2_101);

    expect(service.get('key')).toBeUndefined();
    expect(service.get('key')).toBeUndefined();
  });

  it('getOrSet reuses cached value and does not call factory twice', async () => {
    const nowSpy = jest.spyOn(Date, 'now');
    nowSpy.mockReturnValue(3_000);
    const factory = jest.fn().mockResolvedValue('loaded');

    await expect(service.getOrSet('k', factory, 1_000)).resolves.toBe('loaded');
    await expect(service.getOrSet('k', factory, 1_000)).resolves.toBe('loaded');

    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('invalidate removes a single key', () => {
    service.set('a', 1, 1_000);
    service.invalidate('a');

    expect(service.get('a')).toBeUndefined();
  });

  it('invalidateByPrefix removes only matching keys', () => {
    service.set('team:1', 'a', 1_000);
    service.set('team:2', 'b', 1_000);
    service.set('project:1', 'c', 1_000);

    service.invalidateByPrefix('team:');

    expect(service.get('team:1')).toBeUndefined();
    expect(service.get('team:2')).toBeUndefined();
    expect(service.get('project:1')).toBe('c');
  });

  it('clears store on module destroy', () => {
    service.set('key', 'value', 1_000);

    service.onModuleDestroy();

    expect(service.get('key')).toBeUndefined();
  });
});
