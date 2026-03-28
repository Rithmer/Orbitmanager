import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as argon2 from 'argon2';

const connectionString =
  process.env['DATABASE_URL'] ??
  'postgresql://postgres:postgres@127.0.0.1:5434/task_manager_e2e';

const parsedUrl = new URL(connectionString);
const databaseName = parsedUrl.pathname.replace(/^\/+/, '');

if (!databaseName.endsWith('_e2e')) {
  throw new Error(
    `Refusing to seed non-e2e database "${databaseName || '<unknown>'}".`,
  );
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const TEAM_COUNT = 10;
const TASKS_PER_TEAM = 5;
const TEST_PASSWORD = process.env['E2E_SEED_PASSWORD'] ?? 'Test123!';
const ADMIN_PASSWORD = 'Admin123!';
const TABLES = [
  'audit_logs',
  'project_members',
  'team_members',
  'tasks',
  'projects',
  'teams',
  'users',
];

const projectStatuses = [
  'active',
  'active',
  'on_hold',
  'active',
  'completed',
  'active',
  'archived',
  'active',
  'on_hold',
  'active',
] as const;

const taskTemplates = [
  { suffix: 'Backlog Grooming', difficulty: 1, status: 'new', deadlineShiftDays: 5 },
  {
    suffix: 'API Delivery',
    difficulty: 3,
    status: 'in_progress',
    deadlineShiftDays: 9,
  },
  {
    suffix: 'Frontend Handoff',
    difficulty: 2,
    status: 'review',
    deadlineShiftDays: 4,
  },
  { suffix: 'Regression Fix', difficulty: 4, status: 'done', deadlineShiftDays: -2 },
  {
    suffix: 'Legacy Cleanup',
    difficulty: 5,
    status: 'cancelled',
    deadlineShiftDays: 14,
  },
] as const;

type SeedUser = {
  login: string;
  fullName: string;
  profession: string;
  password: string;
  accountRole: 'admin' | 'member';
};

function ownerLoginForTeam(teamIndex: number): string {
  return teamIndex === 1
    ? 'admin'
    : `team${String(teamIndex).padStart(2, '0')}_owner`;
}

function buildUsers(): SeedUser[] {
  const users: SeedUser[] = [];

  for (let teamIndex = 1; teamIndex <= TEAM_COUNT; teamIndex += 1) {
    const padded = String(teamIndex).padStart(2, '0');
    users.push(
      {
        login: ownerLoginForTeam(teamIndex),
        fullName: teamIndex === 1 ? 'admin' : `Team ${padded} Owner`,
        profession:
          teamIndex === 1 ? 'System Administrator' : 'Engineering Manager',
        password: teamIndex === 1 ? ADMIN_PASSWORD : TEST_PASSWORD,
        accountRole: teamIndex === 1 ? 'admin' : 'member',
      },
      {
        login: `team${padded}_lead`,
        fullName: `Team ${padded} Lead`,
        profession: 'Tech Lead',
        password: TEST_PASSWORD,
        accountRole: 'member',
      },
      {
        login: `team${padded}_dev1`,
        fullName: `Team ${padded} Developer 1`,
        profession: 'Backend Developer',
        password: TEST_PASSWORD,
        accountRole: 'member',
      },
      {
        login: `team${padded}_dev2`,
        fullName: `Team ${padded} Developer 2`,
        profession: 'Frontend Developer',
        password: TEST_PASSWORD,
        accountRole: 'member',
      },
      {
        login: `team${padded}_dev3`,
        fullName: `Team ${padded} Developer 3`,
        profession: 'QA Engineer',
        password: TEST_PASSWORD,
        accountRole: 'member',
      },
      {
        login: `team${padded}_observer`,
        fullName: `Team ${padded} Observer`,
        profession: 'Business Analyst',
        password: TEST_PASSWORD,
        accountRole: 'member',
      },
    );
  }

  return users;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

async function main(): Promise<void> {
  const defaultPasswordHash = await argon2.hash(TEST_PASSWORD);
  const adminPasswordHash = await argon2.hash(ADMIN_PASSWORD);
  const seedUsers = buildUsers();

  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${TABLES.map((table) => `"${table}"`).join(', ')} RESTART IDENTITY CASCADE`,
  );

  await prisma.user.createMany({
    data: seedUsers.map((user) => ({
      login: user.login,
      password:
        user.password === ADMIN_PASSWORD
          ? adminPasswordHash
          : defaultPasswordHash,
      fullName: user.fullName,
      profession: user.profession,
      accountStatus: 'active',
      accountRole: user.accountRole,
    })),
  });

  const users = await prisma.user.findMany({
    where: { login: { in: seedUsers.map((user) => user.login) } },
    orderBy: { id: 'asc' },
  });

  const userByLogin = new Map(users.map((user) => [user.login, user]));
  const now = new Date();

  for (let teamIndex = 1; teamIndex <= TEAM_COUNT; teamIndex += 1) {
    const padded = String(teamIndex).padStart(2, '0');
    const owner = userByLogin.get(ownerLoginForTeam(teamIndex));
    const lead = userByLogin.get(`team${padded}_lead`);
    const dev1 = userByLogin.get(`team${padded}_dev1`);
    const dev2 = userByLogin.get(`team${padded}_dev2`);
    const dev3 = userByLogin.get(`team${padded}_dev3`);
    const observer = userByLogin.get(`team${padded}_observer`);

    if (!owner || !lead || !dev1 || !dev2 || !dev3 || !observer) {
      throw new Error(`Missing generated users for team ${padded}.`);
    }

    const members = [owner, lead, dev1, dev2, dev3, observer];

    const team = await prisma.team.create({
      data: {
        name: `Team ${padded}`,
        description: `Seeded team ${padded} for e2e and manual UI checks.`,
        createdById: owner.id,
      },
    });

    await prisma.teamMember.createMany({
      data: [
        { teamId: team.id, userId: owner.id, teamRole: 'owner' },
        { teamId: team.id, userId: lead.id, teamRole: 'member' },
        { teamId: team.id, userId: dev1.id, teamRole: 'member' },
        { teamId: team.id, userId: dev2.id, teamRole: 'member' },
        { teamId: team.id, userId: dev3.id, teamRole: 'member' },
        { teamId: team.id, userId: observer.id, teamRole: 'observer' },
      ],
    });

    const project = await prisma.project.create({
      data: {
        teamId: team.id,
        name: `Project ${padded}`,
        description: `Primary project for Team ${padded}.`,
        status: projectStatuses[teamIndex - 1],
      },
    });

    await prisma.projectMember.createMany({
      data: [
        { projectId: project.id, userId: owner.id, role: 'team_lead' },
        { projectId: project.id, userId: lead.id, role: 'team_lead' },
        { projectId: project.id, userId: dev1.id, role: 'developer' },
        { projectId: project.id, userId: dev2.id, role: 'developer' },
        { projectId: project.id, userId: dev3.id, role: 'developer' },
        { projectId: project.id, userId: observer.id, role: 'observer' },
      ],
    });

    const taskAssignees = [owner, lead, dev1, dev2, dev3];

    const createdTasks = [];
    for (let i = 0; i < taskTemplates.length; i++) {
      const template = taskTemplates[i];
      const task = await prisma.task.create({
        data: {
          projectId: project.id,
          name: `${team.name} ${template.suffix}`,
          description: `Seeded task ${i + 1} for ${team.name}.`,
          deadline: addDays(now, template.deadlineShiftDays + teamIndex),
          status: template.status,
          difficulty: template.difficulty,
          createdById: owner.id,
          assignees: {
            create: { userId: taskAssignees[i]!.id },
          },
        },
      });
      createdTasks.push(task);
    }

    await prisma.auditLog.createMany({
      data: [
        {
          userId: owner.id,
          action: 'create',
          entityType: 'team',
          entityId: team.id,
          description: `Seeded team ${team.name}`,
        },
        {
          userId: owner.id,
          action: 'create',
          entityType: 'project',
          entityId: project.id,
          description: `Seeded project ${project.name}`,
        },
        ...createdTasks.map((task, index) => ({
          userId: owner.id,
          action: 'create',
          entityType: 'task',
          entityId: task.id,
          description: `Seeded task ${index + 1} for ${project.name}`,
        })),
      ],
    });

    const assignedLogins = members.map((member) => member.login).join(', ');
    console.log(
      `Seeded ${team.name}: users [${assignedLogins}], project ${project.name}, tasks ${TASKS_PER_TEAM}`,
    );
  }

  const [usersCount, teamsCount, projectsCount, tasksCount] = await Promise.all([
    prisma.user.count(),
    prisma.team.count(),
    prisma.project.count(),
    prisma.task.count(),
  ]);

  console.log(`E2E seed complete for ${databaseName}`);
  console.log(
    `Users: ${usersCount}, teams: ${teamsCount}, projects: ${projectsCount}, tasks: ${tasksCount}`,
  );
  console.log(`Password for all seeded users: ${TEST_PASSWORD}`);
  console.log(`Admin user: admin / ${ADMIN_PASSWORD}`);
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
