import { ProjectRole } from '@/common/enums/project-role.enum';

export interface ProjectMember {
  id: number;
  projectId: number;
  userId: number;
  role: ProjectRole;
  assignedAt: string;
}
