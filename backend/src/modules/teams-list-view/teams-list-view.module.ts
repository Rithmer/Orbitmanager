import { Module } from '@nestjs/common';
import { TeamsListViewController } from './teams-list-view.controller';
import { TeamsListViewService } from './teams-list-view.service';

@Module({
  controllers: [TeamsListViewController],
  providers: [TeamsListViewService],
})
export class TeamsListViewModule {}
