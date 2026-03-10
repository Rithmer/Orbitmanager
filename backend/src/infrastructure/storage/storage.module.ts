import { Module, Global } from '@nestjs/common';
import { JsonFileService } from './json-file.service';

@Global()
@Module({
  providers: [JsonFileService],
  exports: [JsonFileService],
})
export class StorageModule {}
