import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as argon2 from 'argon2';

const connectionString =
  process.env['DATABASE_URL'] ??
  'postgresql://postgres:postgres@localhost:5433/task_manager';

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const ADMIN_PASSWORD = 'Admin123!';
const DEFAULT_PASSWORD = 'Password123!';
const TOTAL_USERS = 220;
const TEAM_SIZES = [
  5, 6, 8, 9, 11, 13, 15, 18, 20, 22, 25, 28, 31, 34, 37, 40, 43, 46, 49, 52,
  56, 60,
] as const;
const TEAM_OWNER_INDEXES = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 22, 23,
] as const;

const EVENT_COLORS = [
  '#3b82f6',
  '#ef4444',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
] as const;

const PROFESSIONS = [
  'Frontend Developer',
  'Backend Developer',
  'Fullstack Developer',
  'QA Engineer',
  'DevOps Engineer',
  'Product Manager',
  'Data Analyst',
  'System Analyst',
  'ML Engineer',
  'Security Engineer',
  'UX Designer',
  'Delivery Manager',
] as const;

const FIRST_NAMES = [
  'Andrey',
  'Alexey',
  'Maria',
  'Dmitry',
  'Anna',
  'Nikita',
  'Elena',
  'Artem',
  'Olga',
  'Kirill',
  'Daria',
  'Pavel',
  'Victoria',
  'Roman',
  'Ivan',
  'Natalia',
  'Maxim',
  'Svetlana',
] as const;

const LAST_NAMES = [
  'Abramov',
  'Belova',
  'Chernov',
  'Demina',
  'Ershov',
  'Filatova',
  'Gromov',
  'Karpova',
  'Loginov',
  'Mironova',
  'Tarasov',
] as const;

const HISTORY_TASK_ACTIONS = [
  'Refactor',
  'Ship',
  'Document',
  'Automate',
  'Stabilize',
  'Backfill',
  'Tune',
  'Rework',
  'Optimize',
  'Validate',
] as const;

const HISTORY_TASK_OBJECTS = [
  'access rules',
  'notification flow',
  'search indexing',
  'dashboard widget',
  'release checklist',
  'sync pipeline',
  'report export',
  'permission matrix',
  'integration contract',
  'deployment profile',
] as const;

const CURRENT_TASK_ACTIONS = [
  'Prepare',
  'Implement',
  'Review',
  'Stabilize',
  'Extend',
  'Verify',
  'Coordinate',
  'Rework',
  'Tune',
  'Measure',
] as const;

const CURRENT_TASK_OBJECTS = [
  'release cut',
  'monitoring pack',
  'rollback playbook',
  'feature flag rollout',
  'import queue',
  'data contract',
  'regression batch',
  'vendor mapping',
  'SLA dashboard',
  'capacity report',
  'handoff checklist',
  'priority lane',
  'notification rules',
  'audit trail',
  'status digest',
] as const;

type SeedUser = {
  login: string;
  fullName: string;
  profession: string;
  accountRole: 'admin' | 'member';
};

const CORE_USERS: SeedUser[] = [
  {
    login: 'admin',
    fullName: 'System Administrator',
    profession: 'Platform Administrator',
    accountRole: 'admin',
  },
  {
    login: 'ivanov',
    fullName: 'Alexey Ivanov',
    profession: 'Frontend Developer',
    accountRole: 'member',
  },
  {
    login: 'petrova',
    fullName: 'Maria Petrova',
    profession: 'Backend Developer',
    accountRole: 'member',
  },
  {
    login: 'sidorov',
    fullName: 'Dmitry Sidorov',
    profession: 'Fullstack Developer',
    accountRole: 'member',
  },
  {
    login: 'kuznetsova',
    fullName: 'Anna Kuznetsova',
    profession: 'UX Designer',
    accountRole: 'member',
  },
  {
    login: 'volkov',
    fullName: 'Nikita Volkov',
    profession: 'DevOps Engineer',
    accountRole: 'member',
  },
  {
    login: 'morozova',
    fullName: 'Elena Morozova',
    profession: 'QA Engineer',
    accountRole: 'member',
  },
  {
    login: 'novikov',
    fullName: 'Artem Novikov',
    profession: 'Project Manager',
    accountRole: 'member',
  },
  {
    login: 'fedorova',
    fullName: 'Olga Fedorova',
    profession: 'Data Analyst',
    accountRole: 'member',
  },
  {
    login: 'sokolov',
    fullName: 'Kirill Sokolov',
    profession: 'Mobile Developer',
    accountRole: 'member',
  },
  {
    login: 'kozlova',
    fullName: 'Daria Kozlova',
    profession: 'Technical Writer',
    accountRole: 'member',
  },
  {
    login: 'lebedev',
    fullName: 'Pavel Lebedev',
    profession: 'System Analyst',
    accountRole: 'member',
  },
  {
    login: 'egorova',
    fullName: 'Victoria Egorova',
    profession: 'Scrum Master',
    accountRole: 'member',
  },
  {
    login: 'popov',
    fullName: 'Roman Popov',
    profession: 'Backend Developer',
    accountRole: 'member',
  },
  {
    login: 'vasilev',
    fullName: 'Ivan Vasilev',
    profession: 'Frontend Developer',
    accountRole: 'member',
  },
  {
    login: 'smirnova',
    fullName: 'Natalia Smirnova',
    profession: 'QA Lead',
    accountRole: 'member',
  },
  {
    login: 'orlov',
    fullName: 'Maxim Orlov',
    profession: 'Database Administrator',
    accountRole: 'member',
  },
  {
    login: 'andreeva',
    fullName: 'Svetlana Andreeva',
    profession: 'Product Owner',
    accountRole: 'member',
  },
  {
    login: 'baranov',
    fullName: 'Denis Baranov',
    profession: 'Security Engineer',
    accountRole: 'member',
  },
  {
    login: 'nikolaev',
    fullName: 'Egor Nikolaev',
    profession: 'ML Engineer',
    accountRole: 'member',
  },
  {
    login: 'observer1',
    fullName: 'Vladimir Zaitsev',
    profession: 'Stakeholder',
    accountRole: 'member',
  },
  {
    login: 'observer2',
    fullName: 'Irina Belova',
    profession: 'Investor Relations',
    accountRole: 'member',
  },
];

const TEAM_CATALOG: Array<{
  name: string;
  description: string;
  focus: string;
}> = [
  {
    name: 'Frontend Core',
    description: 'React applications, design surface and interaction quality.',
    focus: 'frontend delivery',
  },
  {
    name: 'Backend Platform',
    description: 'Public API, auth flows and service contracts.',
    focus: 'backend platform',
  },
  {
    name: 'Mobile Studio',
    description: 'Mobile release train for iOS and Android experiences.',
    focus: 'mobile delivery',
  },
  {
    name: 'Design System',
    description: 'Shared components, accessibility and brand consistency.',
    focus: 'design system',
  },
  {
    name: 'QA Automation',
    description: 'Regression coverage and release quality assurance.',
    focus: 'quality automation',
  },
  {
    name: 'DevOps Reliability',
    description: 'Build pipelines, environments and observability.',
    focus: 'platform reliability',
  },
  {
    name: 'Data Warehouse',
    description: 'Ingestion pipelines, marts and reporting storage.',
    focus: 'data platform',
  },
  {
    name: 'Product Analytics',
    description: 'Dashboards, experiments and product insight flows.',
    focus: 'product analytics',
  },
  {
    name: 'Security Operations',
    description: 'Access control, audit readiness and hardening.',
    focus: 'security operations',
  },
  {
    name: 'CRM Integrations',
    description: 'Customer syncs, partner connectors and lead routing.',
    focus: 'CRM integrations',
  },
  {
    name: 'Support Automation',
    description: 'Support tooling and service process optimization.',
    focus: 'support automation',
  },
  {
    name: 'Marketplace Core',
    description: 'Catalog, checkout and seller lifecycle services.',
    focus: 'marketplace operations',
  },
  {
    name: 'Billing Systems',
    description: 'Payments, invoicing and reconciliation services.',
    focus: 'billing systems',
  },
  {
    name: 'HR Platform',
    description: 'Employee lifecycle products and internal workflows.',
    focus: 'HR systems',
  },
  {
    name: 'Document Flow',
    description: 'Templates, approvals and document knowledge base.',
    focus: 'document automation',
  },
  {
    name: 'AI Assistant Lab',
    description: 'Copilots, semantic search and prompt-driven tools.',
    focus: 'AI products',
  },
  {
    name: 'Risk Management',
    description: 'Risk scoring, controls and compliance delivery.',
    focus: 'risk management',
  },
  {
    name: 'Operations Control',
    description: 'Dispatching, monitoring and execution discipline.',
    focus: 'operations control',
  },
  {
    name: 'Growth Experiments',
    description: 'Funnels, campaigns and experiment lifecycle tooling.',
    focus: 'growth delivery',
  },
  {
    name: 'Partner Integrations',
    description: 'Vendor APIs, settlements and external collaboration.',
    focus: 'partner integrations',
  },
  {
    name: 'Warehouse Digital',
    description: 'Stock routing, scanners and warehouse visibility.',
    focus: 'warehouse automation',
  },
  {
    name: 'Enterprise Delivery',
    description: 'Large-customer rollouts and enterprise change requests.',
    focus: 'enterprise delivery',
  },
];

type TeamBlueprint = {
  name: string;
  description: string;
  focus: string;
  size: number;
  ownerIndex: number;
  memberIndexes: number[];
};

type CreatedProject = {
  id: number;
  name: string;
  status: string;
};

type SeedAuditLog = {
  userId: number;
  action: string;
  entityType: string;
  entityId: number | null;
  oldValue?: string | null;
  newValue?: string | null;
  description: string;
  timestamp: Date;
};

type SeedCalendarEvent = {
  userId: number;
  projectId: number | null;
  taskId: number | null;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  color: string;
};

type SeedCounters = {
  teams: number;
  teamMembers: number;
  projects: number;
  projectMembers: number;
  tasks: number;
  auditLogs: number;
  calendarEvents: number;
};

type TeamSummary = {
  name: string;
  size: number;
  projects: number;
  cancelledTaskCount: number;
  cancelledOwnerLogin: string;
};

function days(value: number): number {
  return value * 24 * 60 * 60 * 1000;
}

function addDays(date: Date, value: number): Date {
  return new Date(date.getTime() + days(value));
}

function addHours(date: Date, value: number): Date {
  return new Date(date.getTime() + value * 60 * 60 * 1000);
}

function withHour(date: Date, hour: number): Date {
  const next = new Date(date);
  next.setUTCHours(hour, 0, 0, 0);
  return next;
}

function pick<T>(values: readonly T[], seed: number): T {
  return values[Math.abs(seed) % values.length];
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getProjectCount(teamSize: number): number {
  if (teamSize <= 10) {
    return 3;
  }
  if (teamSize <= 20) {
    return 4;
  }
  if (teamSize <= 30) {
    return 5;
  }
  if (teamSize <= 45) {
    return 6;
  }
  return 7;
}

function getHistoryProjectCount(projectCount: number): number {
  return projectCount >= 6 ? 3 : 2;
}

function getHistoryDistribution(historyProjectCount: number): number[] {
  return historyProjectCount === 2 ? [8, 7] : [5, 5, 5];
}

function getCurrentTaskTarget(
  teamSize: number,
  currentProjectIndex: number,
): number {
  return Math.max(6, Math.ceil(teamSize / 6) + currentProjectIndex + 3);
}

function buildUsers(): SeedUser[] {
  if (CORE_USERS.length > TOTAL_USERS) {
    throw new Error('CORE_USERS is larger than TOTAL_USERS.');
  }

  const generatedUsers: SeedUser[] = [];
  const generatedCount = TOTAL_USERS - CORE_USERS.length;

  for (let index = 0; index < generatedCount; index += 1) {
    const firstName = FIRST_NAMES[index % FIRST_NAMES.length];
    const lastName = LAST_NAMES[Math.floor(index / FIRST_NAMES.length)];

    generatedUsers.push({
      login: `member${String(index + 1).padStart(3, '0')}`,
      fullName: `${firstName} ${lastName}`,
      profession: pick(PROFESSIONS, index),
      accountRole: 'member',
    });
  }

  return [...CORE_USERS, ...generatedUsers];
}

function buildTeamBlueprints(userCount: number): TeamBlueprint[] {
  if (TEAM_CATALOG.length !== TEAM_SIZES.length) {
    throw new Error('TEAM_CATALOG and TEAM_SIZES must have the same size.');
  }

  if (TEAM_CATALOG.length !== TEAM_OWNER_INDEXES.length) {
    throw new Error('TEAM_OWNER_INDEXES must align with TEAM_CATALOG.');
  }

  const rosters = buildTeamRosters(
    userCount,
    [...TEAM_SIZES],
    [...TEAM_OWNER_INDEXES],
  );

  return TEAM_CATALOG.map((team, index) => ({
    ...team,
    size: TEAM_SIZES[index],
    ownerIndex: TEAM_OWNER_INDEXES[index],
    memberIndexes: rosters[index],
  }));
}

function buildTeamRosters(
  userCount: number,
  teamSizes: number[],
  ownerIndexes: number[],
): number[][] {
  const rosters: number[][] = [];
  let cursor = 0;

  for (let teamIndex = 0; teamIndex < teamSizes.length; teamIndex += 1) {
    const teamSize = teamSizes[teamIndex];
    const ownerIndex = ownerIndexes[teamIndex];
    const roster: number[] = [ownerIndex];
    let offset = 0;

    while (roster.length < teamSize) {
      const candidate = (cursor + offset) % userCount;
      if (!roster.includes(candidate)) {
        roster.push(candidate);
      }
      offset += 1;
    }

    rosters.push(roster);
    cursor = (cursor + Math.max(3, Math.floor(teamSize * 0.6))) % userCount;
  }

  ensureFullCoverage(rosters, userCount, ownerIndexes);
  return rosters;
}

function ensureFullCoverage(
  rosters: number[][],
  userCount: number,
  ownerIndexes: number[],
): void {
  const frequencies = new Map<number, number>();

  const adjustFrequency = (userIndex: number, delta: number) => {
    frequencies.set(userIndex, (frequencies.get(userIndex) ?? 0) + delta);
  };

  for (const roster of rosters) {
    for (const userIndex of roster) {
      adjustFrequency(userIndex, 1);
    }
  }

  const uncovered: number[] = [];
  for (let userIndex = 0; userIndex < userCount; userIndex += 1) {
    if (!frequencies.has(userIndex)) {
      uncovered.push(userIndex);
    }
  }

  for (const uncoveredUserIndex of uncovered) {
    let injected = false;

    for (
      let teamIndex = rosters.length - 1;
      teamIndex >= 0 && !injected;
      teamIndex -= 1
    ) {
      const roster = rosters[teamIndex];

      if (roster.includes(uncoveredUserIndex)) {
        injected = true;
        break;
      }

      for (let position = roster.length - 1; position >= 0; position -= 1) {
        const candidate = roster[position];

        if (candidate === ownerIndexes[teamIndex]) {
          continue;
        }

        if ((frequencies.get(candidate) ?? 0) <= 1) {
          continue;
        }

        roster[position] = uncoveredUserIndex;
        adjustFrequency(candidate, -1);
        adjustFrequency(uncoveredUserIndex, 1);
        injected = true;
        break;
      }
    }

    if (!injected) {
      throw new Error(
        `Failed to inject uncovered user index ${uncoveredUserIndex}.`,
      );
    }
  }
}

function buildProjectName(
  team: TeamBlueprint,
  projectIndex: number,
  historyProjectCount: number,
): string {
  if (projectIndex === 0) {
    return `${team.name} Foundation`;
  }

  if (projectIndex === 1) {
    return `${team.name} Stabilization`;
  }

  if (projectIndex === 2 && historyProjectCount === 3) {
    return `${team.name} Migration`;
  }

  return `${team.name} Delivery Stream ${projectIndex - historyProjectCount + 1}`;
}

function buildProjectDescription(
  team: TeamBlueprint,
  projectName: string,
  status: string,
): string {
  return `${projectName} for ${team.focus}. Seeded status: ${status}.`;
}

function buildProjectStatus(
  projectIndex: number,
  historyProjectCount: number,
  currentProjectIndex: number,
  currentProjectCount: number,
): string {
  if (projectIndex < historyProjectCount) {
    if (projectIndex === 1) {
      return 'archived';
    }
    return 'completed';
  }

  if (
    currentProjectCount > 1 &&
    currentProjectIndex === currentProjectCount - 1
  ) {
    return 'on_hold';
  }

  return 'active';
}

function buildHistoricalTaskName(assigneeName: string, seed: number): string {
  const shortName = assigneeName.split(' ')[0];
  const sequence = String((seed % 90) + 10).padStart(2, '0');
  return `${pick(HISTORY_TASK_ACTIONS, seed)} ${pick(HISTORY_TASK_OBJECTS, seed + 3)} ${sequence} for ${shortName}`;
}

function buildHistoricalTaskDescription(
  team: TeamBlueprint,
  projectName: string,
  assigneeName: string,
): string {
  return `${assigneeName} closed this task during ${projectName} while delivering ${team.focus}.`;
}

function buildCurrentTaskName(status: string, seed: number): string {
  const statusSuffix =
    status === 'cancelled'
      ? 'recovery'
      : status === 'review'
        ? 'validation'
        : status === 'done'
          ? 'wrap-up'
          : 'execution';

  return `${pick(CURRENT_TASK_ACTIONS, seed)} ${pick(CURRENT_TASK_OBJECTS, seed + 5)} ${statusSuffix} ${((seed % 7) + 1).toString()}`;
}

function buildCurrentTaskDescription(
  team: TeamBlueprint,
  projectName: string,
  status: string,
): string {
  return `Current ${status} task for ${projectName} in ${team.name}, focused on ${team.focus}.`;
}

function queueAuditLog(
  buffer: SeedAuditLog[],
  counters: SeedCounters,
  entry: SeedAuditLog,
): void {
  buffer.push(entry);
  counters.auditLogs += 1;
}

function queueCalendarEvent(
  buffer: SeedCalendarEvent[],
  counters: SeedCounters,
  entry: SeedCalendarEvent,
): void {
  buffer.push(entry);
  counters.calendarEvents += 1;
}

async function flushAuditLogs(buffer: SeedAuditLog[]): Promise<void> {
  while (buffer.length > 0) {
    const batch = buffer.splice(0, 500);
    await prisma.auditLog.createMany({ data: batch });
  }
}

async function flushCalendarEvents(buffer: SeedCalendarEvent[]): Promise<void> {
  while (buffer.length > 0) {
    const batch = buffer.splice(0, 500);
    await prisma.calendarEvent.createMany({ data: batch });
  }
}

function queueProjectLifecycleLogs(
  auditBuffer: SeedAuditLog[],
  counters: SeedCounters,
  ownerId: number,
  projectId: number,
  projectName: string,
  status: string,
  createdAt: Date,
): void {
  queueAuditLog(auditBuffer, counters, {
    userId: ownerId,
    action: 'create',
    entityType: 'project',
    entityId: projectId,
    description: `Created project "${projectName}".`,
    timestamp: createdAt,
  });

  if (status === 'completed' || status === 'archived' || status === 'on_hold') {
    queueAuditLog(auditBuffer, counters, {
      userId: ownerId,
      action: 'update',
      entityType: 'project',
      entityId: projectId,
      oldValue: 'active',
      newValue: status,
      description: `Project "${projectName}" moved from active to ${status}.`,
      timestamp: addDays(createdAt, 14),
    });
  }
}

function queueTaskLifecycleLogs(
  auditBuffer: SeedAuditLog[],
  counters: SeedCounters,
  params: {
    creatorId: number;
    assigneeId: number;
    taskId: number;
    taskName: string;
    createdAt: Date;
    status: string;
  },
): void {
  const { creatorId, assigneeId, taskId, taskName, createdAt, status } = params;

  queueAuditLog(auditBuffer, counters, {
    userId: creatorId,
    action: 'create',
    entityType: 'task',
    entityId: taskId,
    description: `Created task "${taskName}".`,
    timestamp: createdAt,
  });

  queueAuditLog(auditBuffer, counters, {
    userId: creatorId,
    action: 'assign',
    entityType: 'task',
    entityId: taskId,
    description: `Assigned "${taskName}" to user ${assigneeId}.`,
    timestamp: addHours(createdAt, 2),
  });

  if (status === 'new') {
    return;
  }

  if (status === 'cancelled') {
    queueAuditLog(auditBuffer, counters, {
      userId: assigneeId,
      action: 'status_change',
      entityType: 'task',
      entityId: taskId,
      oldValue: 'new',
      newValue: 'cancelled',
      description: `Task "${taskName}" moved from new to cancelled.`,
      timestamp: addDays(createdAt, 2),
    });
    return;
  }

  queueAuditLog(auditBuffer, counters, {
    userId: assigneeId,
    action: 'status_change',
    entityType: 'task',
    entityId: taskId,
    oldValue: 'new',
    newValue: 'in_progress',
    description: `Task "${taskName}" moved from new to in_progress.`,
    timestamp: addDays(createdAt, 1),
  });

  if (status === 'in_progress') {
    return;
  }

  queueAuditLog(auditBuffer, counters, {
    userId: assigneeId,
    action: 'status_change',
    entityType: 'task',
    entityId: taskId,
    oldValue: 'in_progress',
    newValue: 'review',
    description: `Task "${taskName}" moved from in_progress to review.`,
    timestamp: addDays(createdAt, 3),
  });

  if (status === 'review') {
    return;
  }

  queueAuditLog(auditBuffer, counters, {
    userId: assigneeId,
    action: 'status_change',
    entityType: 'task',
    entityId: taskId,
    oldValue: 'review',
    newValue: 'done',
    description: `Task "${taskName}" moved from review to done.`,
    timestamp: addDays(createdAt, 5),
  });
}

function assertSeedRequirements(
  users: Array<{ id: number; login: string }>,
  doneTasksByUser: Map<number, number>,
  teamSummaries: TeamSummary[],
): void {
  const minimumDoneTasks = Math.min(
    ...users.map((user) => doneTasksByUser.get(user.id) ?? 0),
  );

  if (teamSummaries.length < 20 || teamSummaries.length > 25) {
    throw new Error(`Expected 20-25 teams, received ${teamSummaries.length}.`);
  }

  const invalidTeams = teamSummaries.filter(
    (team) => team.size < 5 || team.size > 60,
  );
  if (invalidTeams.length > 0) {
    throw new Error(
      `Found teams with invalid size: ${invalidTeams.map((team) => team.name).join(', ')}`,
    );
  }

  const underSeededUsers = users.filter(
    (user) => (doneTasksByUser.get(user.id) ?? 0) < 15,
  );
  if (underSeededUsers.length > 0) {
    throw new Error(
      `Users without minimum done history: ${underSeededUsers
        .slice(0, 10)
        .map((user) => user.login)
        .join(', ')}`,
    );
  }

  const teamsWithoutCancelledWork = teamSummaries.filter(
    (team) => team.cancelledTaskCount === 0,
  );
  if (teamsWithoutCancelledWork.length > 0) {
    throw new Error(
      `Each team needs a failed-task owner, but these teams have none: ${teamsWithoutCancelledWork
        .map((team) => team.name)
        .join(', ')}`,
    );
  }

  if (minimumDoneTasks < 15) {
    throw new Error(
      `Minimum done task history is ${minimumDoneTasks}, expected at least 15.`,
    );
  }
}

async function resetDatabase(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "refresh_tokens",
      "audit_logs",
      "calendar_events",
      "task_assignees",
      "tasks",
      "project_members",
      "projects",
      "team_members",
      "teams",
      "users"
    RESTART IDENTITY CASCADE
  `);
}

async function main(): Promise<void> {
  console.log('Resetting database...');
  await resetDatabase();

  const seedUsers = buildUsers();
  const teamBlueprints = buildTeamBlueprints(seedUsers.length);
  const defaultPasswordHash = await argon2.hash(DEFAULT_PASSWORD);
  const adminPasswordHash = await argon2.hash(ADMIN_PASSWORD);

  console.log(`Creating ${seedUsers.length} users...`);
  await prisma.user.createMany({
    data: seedUsers.map((user) => ({
      login: user.login,
      password:
        user.accountRole === 'admin' ? adminPasswordHash : defaultPasswordHash,
      fullName: user.fullName,
      profession: user.profession,
      accountStatus: 'active',
      accountRole: user.accountRole,
    })),
  });

  const createdUsers = await prisma.user.findMany({
    where: {
      login: {
        in: seedUsers.map((user) => user.login),
      },
    },
    orderBy: { id: 'asc' },
  });

  const usersByIndex = createdUsers;
  const userNameById = new Map(
    createdUsers.map((user) => [user.id, user.fullName]),
  );
  const userLoginById = new Map(
    createdUsers.map((user) => [user.id, user.login]),
  );
  const doneTasksByUser = new Map(createdUsers.map((user) => [user.id, 0]));
  const historySeededUsers = new Set<number>();
  const auditBuffer: SeedAuditLog[] = [];
  const calendarBuffer: SeedCalendarEvent[] = [];
  const now = new Date();
  const counters: SeedCounters = {
    teams: 0,
    teamMembers: 0,
    projects: 0,
    projectMembers: 0,
    tasks: 0,
    auditLogs: 0,
    calendarEvents: 0,
  };
  const teamSummaries: TeamSummary[] = [];

  for (const [teamIndex, blueprint] of teamBlueprints.entries()) {
    const teamOwnerId = usersByIndex[blueprint.ownerIndex].id;
    const rosterUserIds = blueprint.memberIndexes.map(
      (memberIndex) => usersByIndex[memberIndex].id,
    );
    const observerUserId = rosterUserIds[rosterUserIds.length - 1];
    const assignableUserIds = rosterUserIds.filter(
      (userId) => userId !== observerUserId,
    );
    const troubledUserId =
      assignableUserIds.find((userId) => userId !== teamOwnerId) ?? teamOwnerId;
    const normalCurrentAssignees = assignableUserIds.filter(
      (userId) => userId !== troubledUserId,
    );

    console.log(
      `Seeding team ${teamIndex + 1}/${teamBlueprints.length}: ${blueprint.name} (${blueprint.size} members)`,
    );

    const team = await prisma.team.create({
      data: {
        name: blueprint.name,
        description: blueprint.description,
        createdById: teamOwnerId,
        createdAt: addDays(now, -(280 - teamIndex * 6)),
      },
    });
    counters.teams += 1;

    await prisma.teamMember.createMany({
      data: rosterUserIds.map((userId) => ({
        teamId: team.id,
        userId,
        teamRole:
          userId === teamOwnerId
            ? 'owner'
            : userId === observerUserId
              ? 'observer'
              : 'member',
      })),
    });
    counters.teamMembers += rosterUserIds.length;

    const projectCount = getProjectCount(blueprint.size);
    const historyProjectCount = getHistoryProjectCount(projectCount);
    const currentProjectCount = projectCount - historyProjectCount;
    const projects: CreatedProject[] = [];

    for (let projectIndex = 0; projectIndex < projectCount; projectIndex += 1) {
      const currentProjectIndex = projectIndex - historyProjectCount;
      const status = buildProjectStatus(
        projectIndex,
        historyProjectCount,
        currentProjectIndex,
        currentProjectCount,
      );
      const projectName = buildProjectName(
        blueprint,
        projectIndex,
        historyProjectCount,
      );
      const projectCreatedAt =
        projectIndex < historyProjectCount
          ? addDays(now, -(240 - teamIndex * 3 - projectIndex * 18))
          : addDays(now, -(50 - teamIndex + currentProjectIndex * 7));

      const project = await prisma.project.create({
        data: {
          teamId: team.id,
          name: projectName,
          description: buildProjectDescription(blueprint, projectName, status),
          status,
          createdAt: projectCreatedAt,
        },
      });

      projects.push({
        id: project.id,
        name: project.name,
        status: project.status,
      });
      counters.projects += 1;

      await prisma.projectMember.createMany({
        data: rosterUserIds.map((userId) => ({
          projectId: project.id,
          userId,
          role:
            userId === teamOwnerId
              ? 'team_lead'
              : userId === observerUserId
                ? 'observer'
                : 'developer',
        })),
      });
      counters.projectMembers += rosterUserIds.length;

      queueProjectLifecycleLogs(
        auditBuffer,
        counters,
        teamOwnerId,
        project.id,
        project.name,
        project.status,
        projectCreatedAt,
      );
    }

    const historyProjects = projects.slice(0, historyProjectCount);
    const currentProjects = projects.slice(historyProjectCount);
    const usersNeedingHistory = rosterUserIds.filter(
      (userId) => !historySeededUsers.has(userId),
    );

    for (const [historyUserOffset, userId] of usersNeedingHistory.entries()) {
      const historyDistribution = getHistoryDistribution(
        historyProjects.length,
      );
      const assigneeName = userNameById.get(userId) ?? `User ${userId}`;

      for (const [
        historyProjectIndex,
        taskCount,
      ] of historyDistribution.entries()) {
        const project = historyProjects[historyProjectIndex];

        for (let taskIndex = 0; taskIndex < taskCount; taskIndex += 1) {
          const seed =
            teamIndex * 10_000 +
            userId * 100 +
            historyProjectIndex * 10 +
            taskIndex;
          const createdAt = addDays(
            now,
            -(220 - ((seed + historyUserOffset) % 90)),
          );
          const doneAt = addDays(createdAt, 4 + (seed % 5));
          const deadline = addDays(doneAt, 1 + (seed % 4));
          const taskName = buildHistoricalTaskName(assigneeName, seed);

          const task = await prisma.task.create({
            data: {
              projectId: project.id,
              name: taskName,
              description: buildHistoricalTaskDescription(
                blueprint,
                project.name,
                assigneeName,
              ),
              deadline,
              status: 'done',
              difficulty: 1 + (seed % 5),
              createdById: teamOwnerId,
              createdAt,
              assignees: {
                create: {
                  userId,
                },
              },
            },
          });

          counters.tasks += 1;
          doneTasksByUser.set(userId, (doneTasksByUser.get(userId) ?? 0) + 1);

          queueAuditLog(auditBuffer, counters, {
            userId: teamOwnerId,
            action: 'create',
            entityType: 'task',
            entityId: task.id,
            description: `Created task "${task.name}".`,
            timestamp: createdAt,
          });

          queueAuditLog(auditBuffer, counters, {
            userId,
            action: 'assign',
            entityType: 'task',
            entityId: task.id,
            description: `Assigned "${task.name}" to user ${userId}.`,
            timestamp: addHours(createdAt, 2),
          });

          queueAuditLog(auditBuffer, counters, {
            userId,
            action: 'status_change',
            entityType: 'task',
            entityId: task.id,
            oldValue: 'new',
            newValue: 'in_progress',
            description: `Task "${task.name}" moved from new to in_progress.`,
            timestamp: addDays(createdAt, 1),
          });

          queueAuditLog(auditBuffer, counters, {
            userId,
            action: 'status_change',
            entityType: 'task',
            entityId: task.id,
            oldValue: 'in_progress',
            newValue: 'review',
            description: `Task "${task.name}" moved from in_progress to review.`,
            timestamp: addDays(createdAt, 3),
          });

          queueAuditLog(auditBuffer, counters, {
            userId,
            action: 'status_change',
            entityType: 'task',
            entityId: task.id,
            oldValue: 'review',
            newValue: 'done',
            description: `Task "${task.name}" moved from review to done.`,
            timestamp: doneAt,
          });
        }
      }

      historySeededUsers.add(userId);
    }

    let teamCancelledTaskCount = 0;

    for (const [currentProjectIndex, project] of currentProjects.entries()) {
      const taskTarget = getCurrentTaskTarget(
        blueprint.size,
        currentProjectIndex,
      );
      const cancelledCount = Math.max(1, Math.floor(taskTarget / 8));
      const reviewCount = Math.max(1, Math.floor(taskTarget / 5));
      const inProgressCount = Math.max(2, Math.floor(taskTarget / 3));
      const doneCount = Math.max(1, Math.floor(taskTarget / 8));
      const statusPlan: string[] = [];

      for (let i = 0; i < cancelledCount; i += 1) {
        statusPlan.push('cancelled');
      }
      for (let i = 0; i < reviewCount; i += 1) {
        statusPlan.push('review');
      }
      for (let i = 0; i < inProgressCount; i += 1) {
        statusPlan.push('in_progress');
      }
      for (let i = 0; i < doneCount; i += 1) {
        statusPlan.push('done');
      }
      while (statusPlan.length < taskTarget) {
        statusPlan.push('new');
      }

      for (let taskIndex = 0; taskIndex < taskTarget; taskIndex += 1) {
        const status = statusPlan[taskIndex];
        const seed = teamIndex * 1_000 + currentProjectIndex * 100 + taskIndex;
        const assigneeId =
          status === 'cancelled'
            ? troubledUserId
            : normalCurrentAssignees.length > 0
              ? normalCurrentAssignees[
                  taskIndex % normalCurrentAssignees.length
                ]
              : teamOwnerId;
        const createdAt = addDays(now, -(18 + ((seed + taskIndex) % 20)));
        let deadline: Date;

        if (status === 'done') {
          deadline = addDays(createdAt, 6 + (seed % 5));
        } else if (status === 'cancelled') {
          deadline = addDays(createdAt, 4 + (seed % 6));
        } else if (status === 'review' && taskIndex % 3 === 0) {
          deadline = addDays(now, -(1 + (taskIndex % 4)));
        } else if (status === 'in_progress' && taskIndex % 4 === 0) {
          deadline = addDays(now, -(1 + (taskIndex % 3)));
        } else {
          deadline = addDays(now, 3 + ((seed + taskIndex) % 18));
        }

        const taskName = buildCurrentTaskName(status, seed);

        const task = await prisma.task.create({
          data: {
            projectId: project.id,
            name: taskName,
            description: buildCurrentTaskDescription(
              blueprint,
              project.name,
              status,
            ),
            deadline,
            status,
            difficulty: 1 + ((seed + 2) % 5),
            createdById: teamOwnerId,
            createdAt,
            assignees: {
              create: {
                userId: assigneeId,
              },
            },
          },
        });

        counters.tasks += 1;
        if (status === 'done') {
          doneTasksByUser.set(
            assigneeId,
            (doneTasksByUser.get(assigneeId) ?? 0) + 1,
          );
        }
        if (status === 'cancelled') {
          teamCancelledTaskCount += 1;
        }

        queueTaskLifecycleLogs(auditBuffer, counters, {
          creatorId: teamOwnerId,
          assigneeId,
          taskId: task.id,
          taskName: task.name,
          createdAt,
          status,
        });

        if (status !== 'done' && status !== 'cancelled') {
          const eventStart = withHour(addDays(deadline, -1), 10);
          const eventEnd = withHour(deadline, 18);

          queueCalendarEvent(calendarBuffer, counters, {
            userId: assigneeId,
            projectId: project.id,
            taskId: task.id,
            title: `Deadline: ${task.name}`,
            description: `Planned deadline for ${task.name}.`,
            startDate: eventStart,
            endDate: eventEnd,
            allDay: true,
            color: pick(EVENT_COLORS, seed),
          });
        }
      }
    }

    const anchorProjectId = currentProjects[0]?.id ?? historyProjects[0].id;
    const planningStart = withHour(addDays(now, 2 + (teamIndex % 5)), 10);
    const reviewStart = withHour(addDays(now, 7 + (teamIndex % 6)), 15);

    queueCalendarEvent(calendarBuffer, counters, {
      userId: teamOwnerId,
      projectId: anchorProjectId,
      taskId: null,
      title: `${blueprint.name} planning`,
      description: `Weekly planning for ${blueprint.name}.`,
      startDate: planningStart,
      endDate: addHours(planningStart, 2),
      allDay: false,
      color: pick(EVENT_COLORS, teamIndex),
    });

    queueCalendarEvent(calendarBuffer, counters, {
      userId: troubledUserId,
      projectId: anchorProjectId,
      taskId: null,
      title: `${blueprint.name} risk review`,
      description: `Risk review session for cancelled and delayed work.`,
      startDate: reviewStart,
      endDate: addHours(reviewStart, 1),
      allDay: false,
      color: pick(EVENT_COLORS, teamIndex + 9),
    });

    teamSummaries.push({
      name: blueprint.name,
      size: blueprint.size,
      projects: projectCount,
      cancelledTaskCount: teamCancelledTaskCount,
      cancelledOwnerLogin:
        userLoginById.get(troubledUserId) ?? `user-${troubledUserId}`,
    });

    if (auditBuffer.length >= 500) {
      await flushAuditLogs(auditBuffer);
    }
    if (calendarBuffer.length >= 500) {
      await flushCalendarEvents(calendarBuffer);
    }
  }

  for (const user of createdUsers) {
    queueAuditLog(auditBuffer, counters, {
      userId: user.id,
      action: 'login',
      entityType: 'auth',
      entityId: null,
      description: `User ${user.login} signed in.`,
      timestamp: addDays(now, -((user.id % 6) + 1)),
    });
  }

  await flushAuditLogs(auditBuffer);
  await flushCalendarEvents(calendarBuffer);

  assertSeedRequirements(createdUsers, doneTasksByUser, teamSummaries);

  const minimumDoneTasks = Math.min(
    ...createdUsers.map((user) => doneTasksByUser.get(user.id) ?? 0),
  );
  const maximumDoneTasks = Math.max(
    ...createdUsers.map((user) => doneTasksByUser.get(user.id) ?? 0),
  );
  const minTeamSize = Math.min(...teamSummaries.map((team) => team.size));
  const maxTeamSize = Math.max(...teamSummaries.map((team) => team.size));
  const cancelledOwnersPreview = teamSummaries
    .slice(0, 5)
    .map((team) => `${team.name}: ${team.cancelledOwnerLogin}`)
    .join('; ');

  console.log('\nSeed complete');
  console.log(`  Users:            ${createdUsers.length}`);
  console.log(
    `  Teams:            ${counters.teams} (sizes ${minTeamSize}-${maxTeamSize})`,
  );
  console.log(`  Team members:     ${counters.teamMembers}`);
  console.log(`  Projects:         ${counters.projects}`);
  console.log(`  Project members:  ${counters.projectMembers}`);
  console.log(`  Tasks:            ${counters.tasks}`);
  console.log(`  Audit logs:       ${counters.auditLogs}`);
  console.log(`  Calendar events:  ${counters.calendarEvents}`);
  console.log(
    `  Done tasks/user:  min ${minimumDoneTasks}, max ${maximumDoneTasks}`,
  );
  console.log(`  Failed-task owners: ${cancelledOwnersPreview}`);
  console.log('\n  Login credentials:');
  console.log(`  admin / ${ADMIN_PASSWORD}`);
  console.log(`  any non-admin user / ${DEFAULT_PASSWORD}`);
  console.log(`  Example member login: ${createdUsers[1]?.login ?? 'n/a'}`);
  console.log(`  Seed stamp: ${slugify(now.toISOString())}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
