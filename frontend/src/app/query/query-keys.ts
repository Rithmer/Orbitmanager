export const appQueryKeys = {
  nav: {
    teamsMembersBatch: () => ['nav', 'teams-members-batch'] as const,
    projectsMembersBatch: () => ['nav', 'projects-members-batch'] as const,
  },
  auth: {
    me: ['auth', 'me'] as const,
  },
  dashboard: {
    summary: ['dashboard', 'summary'] as const,
    adminAuditRecent: ['dashboard', 'admin-audit-recent'] as const,
  },
  teams: {
    listView: (params?: Record<string, unknown>) =>
      ['teams', 'list-view', params ?? null] as const,
    members: (teamIds?: readonly number[]) =>
      ['teams', 'members', teamIds ?? []] as const,
    memberUsers: ['teams', 'member-users'] as const,
    reportsOptions: ['reports', 'team-options'] as const,
    risksOptions: ['risks', 'team-options'] as const,
  },
  projects: {
    root: ['projects'] as const,
    listView: (params?: Record<string, unknown>) =>
      ['projects', 'list-view', params ?? null] as const,
    boardView: (projectId: number) => ['projects', 'board-view', projectId] as const,
    members: (projectIds?: readonly number[]) =>
      ['projects', 'members', projectIds ?? []] as const,
    membersByProject: (projectId: number | null) => ['projects', 'members', projectId] as const,
    teamMembers: (teamId: number | null) => ['projects', 'team-members', teamId] as const,
    teamOptions: ['projects', 'team-options'] as const,
    memberUsers: ['projects', 'member-users'] as const,
  },
  board: {
    teamMembers: (teamId: number | null) => ['board', 'team-members', teamId] as const,
    projectPickerList: () => ['board', 'project-picker-projects'] as const,
  },
  calendar: {
    monthView: (params?: Record<string, unknown>) =>
      ['calendar', 'month-view', params ?? null] as const,
  },
  reports: {
    summary: (params?: Record<string, unknown>) =>
      ['reports', 'summary', params ?? null] as const,
    projects: () => ['reports', 'projects'] as const,
    ganttTasks: (params?: Record<string, unknown>) =>
      ['reports', 'gantt-tasks', params ?? null] as const,
  },
  risks: {
    projects: (params?: Record<string, unknown>) =>
      ['risks', 'projects', params ?? null] as const,
    projectRisks: (params?: Record<string, unknown>) =>
      ['risks', 'project-risks', params ?? null] as const,
    taskRisks: (projectId?: number) => ['risks', 'task-risks', projectId ?? null] as const,
  },
  admin: {
    usersRoot: ['admin', 'users'] as const,
    auditRoot: ['admin', 'audit'] as const,
    users: (params?: Record<string, unknown>) => ['admin', 'users', params ?? null] as const,
    audit: (params?: Record<string, unknown>) => ['admin', 'audit', params ?? null] as const,
    mlStatus: ['admin', 'ml-status'] as const,
  },
} as const
