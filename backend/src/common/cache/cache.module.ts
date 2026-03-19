import { Global, Module } from '@nestjs/common';
import { TtlCacheService } from './ttl-cache.service';
import { InMemoryCacheService } from './in-memory-cache.service';

@Global()
@Module({
  providers: [TtlCacheService, InMemoryCacheService],
  exports: [TtlCacheService, InMemoryCacheService],
})
export class CacheModule {}
