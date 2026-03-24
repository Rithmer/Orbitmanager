export const appQueryKeys = {
  nav: {
    /** Batch membership for sidebar access (teams + projects). */
    teamsMembersBatch: () => ['nav', 'teams-members-batch'] as const,
    projectsMembersBatch: () => ['nav', 'projects-members-batch'] as const,
  },
  auth: {
    me: ['auth', 'me'] as const,
  },
  dashboard: {
    summary: ['dashboard', 'summary'] as const,
  },
  teams: {
    listView: (params?: Record<string, unknown>) =>
      ['teams', 'list-view', params ?? null] as const,
    members: (teamIds?: readonly number[]) =>
      ['teams', 'members', teamIds ?? []] as const,
  },
  projects: {
    listView: (params?: Record<string, unknown>) =>
      ['projects', 'list-view', params ?? null] as const,
    boardView: (projectId: number) => ['projects', 'board-view', projectId] as const,
    members: (projectIds?: readonly number[]) =>
      ['projects', 'members', projectIds ?? []] as const,
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
  },
  risks: {
    projects: (params?: Record<string, unknown>) =>
      ['risks', 'projects', params ?? null] as const,
    projectRisks: (params?: Record<string, unknown>) =>
      ['risks', 'project-risks', params ?? null] as const,
    taskRisks: (projectId?: number) => ['risks', 'task-risks', projectId ?? null] as const,
  },
  admin: {
    users: (params?: Record<string, unknown>) => ['admin', 'users', params ?? null] as const,
    audit: (params?: Record<string, unknown>) => ['admin', 'audit', params ?? null] as const,
  },
} as const
