import { Global, Module } from '@nestjs/common';
import { ReadModelResponseFactory } from './read-model-response.factory';

@Global()
@Module({
  providers: [ReadModelResponseFactory],
  exports: [ReadModelResponseFactory],
})
export class ReadModelsModule {}
