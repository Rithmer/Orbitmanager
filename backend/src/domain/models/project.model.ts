import { ProjectStatus } from '../../common/enums/project-status.enum';

export interface Project {
  id: number;
  teamId: number;
  name: string;
  description: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}
