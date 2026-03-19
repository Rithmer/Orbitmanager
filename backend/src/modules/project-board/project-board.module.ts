import { Module } from '@nestjs/common';
import { AccessModule } from '@/common/access/access.module';
import { RiskModule } from '@/modules/risk/risk.module';
import { ProjectBoardController } from './project-board.controller';
import { ProjectBoardService } from './project-board.service';

@Module({
  imports: [AccessModule, RiskModule],
  controllers: [ProjectBoardController],
  providers: [ProjectBoardService],
})
export class ProjectBoardModule {}
