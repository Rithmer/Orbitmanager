import { Module } from '@nestjs/common';
import { AccessModule } from '@/common/access/access.module';
import { RiskModule } from '@/modules/risk/risk.module';
import { ProjectsListViewController } from './projects-list-view.controller';
import { ProjectsListViewService } from './projects-list-view.service';

@Module({
  imports: [AccessModule, RiskModule],
  controllers: [ProjectsListViewController],
  providers: [ProjectsListViewService],
})
export class ProjectsListViewModule {}
