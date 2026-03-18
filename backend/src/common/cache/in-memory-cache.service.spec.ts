import { InMemoryCacheService } from './in-memory-cache.service';

describe('InMemoryCacheService', () => {
  let service: InMemoryCacheService;

  beforeEach(() => {
    service = new InMemoryCacheService();
  });

  it('stores values without ttl', () => {
    service.set('key', 'value');

    expect(service.get('key')).toBe('value');
    expect(service.has('key')).toBe(true);
  });

  it('expires values after ttl', () => {
    const nowSpy = jest.spyOn(Date, 'now');
    nowSpy.mockReturnValue(1_000);

    service.set('key', 'value', { ttlMs: 100 });

    nowSpy.mockReturnValue(1_050);
    expect(service.get('key')).toBe('value');

    nowSpy.mockReturnValue(1_101);
    expect(service.get('key')).toBeUndefined();
    expect(service.has('key')).toBe(false);

    nowSpy.mockRestore();
  });

  it('reuses cached values in remember', async () => {
    const loader = jest.fn().mockResolvedValue('value');

    await expect(service.remember('key', loader)).resolves.toBe('value');
    await expect(service.remember('key', loader)).resolves.toBe('value');

    expect(loader).toHaveBeenCalledTimes(1);
  });
});
