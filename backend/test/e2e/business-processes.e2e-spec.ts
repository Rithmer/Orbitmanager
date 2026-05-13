import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import request from 'supertest';
import { App } from 'supertest/types';
import * as argon2 from 'argon2';
import { Client } from 'pg';
import { AppModule } from '@/app.module';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';

const TABLES = [
  'audit_logs',
  'project_members',
  'team_members',
  'tasks',
  'projects',
  'teams',
  'users',
];

const ADMIN_LOGIN = 'e2e_admin';
const ADMIN_PASSWORD = 'AdminE2E1!';

type AuthResult = {
  accessToken: string;
  refreshToken: string;
  userId: number;
};

type AuditEntry = {
  entityType: string;
  action: string;
};

type IdResponse = {
  id: number;
};

function getDatabaseUrl(): string {
  const databaseUrl = process.env['DATABASE_URL'];
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for postgres-only e2e tests');
  }

  assertSafeE2eDatabase(databaseUrl);
  return databaseUrl;
}

function assertSafeE2eDatabase(databaseUrl: string): void {
  if (process.env['NODE_ENV'] !== 'test') {
    throw new Error(
      `Refusing to run destructive e2e reset outside NODE_ENV=test (got "${process.env['NODE_ENV'] ?? 'undefined'}")`,
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(databaseUrl);
  } catch {
    throw new Error(`Invalid DATABASE_URL for e2e tests: ${databaseUrl}`);
  }

  const databaseName = parsedUrl.pathname.replace(/^\/+/, '');
  if (!databaseName.endsWith('_e2e')) {
    throw new Error(
      `Refusing to reset non-e2e database "${databaseName || '<unknown>'}". Expected a database name ending with "_e2e".`,
    );
  }
}

async function withDatabaseClient<T>(
  operation: (client: Client) => Promise<T>,
): Promise<T> {
  const client = new Client({ connectionString: getDatabaseUrl() });
  try {
    await client.connect();
    return await operation(client);
  } finally {
    await client.end();
  }
}

async function resetDatabase(): Promise<void> {
  const databaseUrl = getDatabaseUrl();

  try {
    await withDatabaseClient(async (client) => {
      await client.query(
        `TRUNCATE TABLE ${TABLES.map((table) => `"${table}"`).join(', ')} RESTART IDENTITY CASCADE`,
      );

      const hashedPassword = await argon2.hash(ADMIN_PASSWORD);
      await client.query(
        `
          INSERT INTO users (
            login,
            password,
            full_name,
            profession,
            account_status,
            account_role,
            created_at,
            updated_at
          )
          VALUES ($1, $2, $3, $4, 'active', 'admin', NOW(), NOW())
        `,
        [ADMIN_LOGIN, hashedPassword, 'E2E Admin', 'Admin'],
      );
    });
  } catch (error) {
    throw new Error(
      `Unable to connect to PostgreSQL for e2e reset (${databaseUrl}): ${String(error)}`,
    );
  }
}

function decodeJwtPayload(token: string): {
  sub: number;
  login: string;
  accountRole: string;
} {
  const base64 = token.split('.')[1];
  return JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
}

function deadlineIn(days: number): string {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + days);
  return deadline.toISOString();
}

describe('Business Processes (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    await resetDatabase();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  const server = () => request(app.getHttpServer());

  async function registerUser(
    login: string,
    password: string,
    fullName: string,
    profession?: string,
  ): Promise<AuthResult> {
    const res = await server()
      .post('/auth/register')
      .send({ login, password, fullName, profession })
      .expect(201);
    const body = res.body as { accessToken: string; refreshToken: string };
    const payload = decodeJwtPayload(body.accessToken);
    return { ...body, userId: payload.sub };
  }

  async function loginUser(
    login: string,
    password: string,
  ): Promise<AuthResult> {
    const res = await server()
      .post('/auth/login')
      .send({ login, password })
      .expect(200);
    const body = res.body as { accessToken: string; refreshToken: string };
    const payload = decodeJwtPayload(body.accessToken);
    return { ...body, userId: payload.sub };
  }

  async function createTeam(token: string, name: string): Promise<number> {
    const res = await server()
      .post('/teams')
      .set('Authorization', `Bearer ${token}`)
      .send({ name })
      .expect(201);

    return (res.body as IdResponse).id;
  }

  async function addTeamMember(
    token: string,
    teamId: number,
    userId: number,
    teamRole: 'member' | 'observer',
  ): Promise<number> {
    const res = await server()
      .post(`/teams/${teamId}/members`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId, teamRole })
      .expect(201);

    return (res.body as IdResponse).id;
  }

  async function createProject(
    token: string,
    teamId: number,
    name: string,
  ): Promise<number> {
    const res = await server()
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ teamId, name })
      .expect(201);

    return (res.body as IdResponse).id;
  }

  async function addProjectMember(
    token: string,
    projectId: number,
    userId: number,
    role: 'developer' | 'observer',
  ): Promise<number> {
    const res = await server()
      .post(`/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId, role })
      .expect(201);

    return (res.body as IdResponse).id;
  }

  async function createTask(
    token: string,
    projectId: number,
    name: string,
    difficulty: number,
    assigneeIds?: number[],
  ): Promise<number> {
    const res = await server()
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        projectId,
        name,
        deadline: deadlineIn(14),
        difficulty,
        assigneeIds,
      })
      .expect(201);

    return (res.body as IdResponse).id;
  }

  it('BP1: registers users, builds a team/project, assigns work and writes audit', async () => {
    const owner = await registerUser('bp1_owner', 'Owner1Pass!', 'BP1 Owner');
    const developer = await registerUser(
      'bp1_dev',
      'Dev1Pass!!',
      'BP1 Developer',
    );
    const ownerLogin = await loginUser('bp1_owner', 'Owner1Pass!');

    const teamId = await createTeam(ownerLogin.accessToken, 'BP1 Team');
    await addTeamMember(
      ownerLogin.accessToken,
      teamId,
      developer.userId,
      'member',
    );
    const projectId = await createProject(
      ownerLogin.accessToken,
      teamId,
      'BP1 Project',
    );
    await addProjectMember(
      ownerLogin.accessToken,
      projectId,
      developer.userId,
      'developer',
    );
    const taskId = await createTask(
      ownerLogin.accessToken,
      projectId,
      'Implement authentication',
      3,
      [developer.userId],
    );

    expect(owner.userId).toBe(ownerLogin.userId);
    expect(taskId).toBeDefined();

    const admin = await loginUser(ADMIN_LOGIN, ADMIN_PASSWORD);
    const auditRes = await server()
      .get('/audit-logs')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    const taskAudit = (auditRes.body.items as AuditEntry[]).find(
      (entry) => entry.entityType === 'task',
    );
    expect(taskAudit).toBeDefined();
  });

  it('BP2: moves an assigned task through statuses and records status audit', async () => {
    const owner = await registerUser('bp2_owner', 'Owner2Pass!', 'BP2 Owner');
    const developer = await registerUser(
      'bp2_dev',
      'Dev2Pass!!!',
      'BP2 Developer',
    );
    const teamId = await createTeam(owner.accessToken, 'BP2 Team');
    await addTeamMember(owner.accessToken, teamId, developer.userId, 'member');
    const projectId = await createProject(
      owner.accessToken,
      teamId,
      'BP2 Project',
    );
    await addProjectMember(
      owner.accessToken,
      projectId,
      developer.userId,
      'developer',
    );
    const taskId = await createTask(
      owner.accessToken,
      projectId,
      'BP2 Test Task',
      2,
    );

    const assigned = await server()
      .patch(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ assigneeIds: [developer.userId] })
      .expect(200);
    expect(assigned.body.assigneeIds).toContain(developer.userId);

    await server()
      .patch(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${developer.accessToken}`)
      .send({ status: 'in_progress' })
      .expect(200);
    await server()
      .patch(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${developer.accessToken}`)
      .send({ status: 'review' })
      .expect(200);
    const done = await server()
      .patch(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ status: 'done' })
      .expect(200);
    expect(done.body.status).toBe('done');

    await server()
      .patch(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ status: 'in_progress' })
      .expect(422);

    const admin = await loginUser(ADMIN_LOGIN, ADMIN_PASSWORD);
    const auditRes = await server()
      .get('/audit-logs')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .query({ entityType: 'task' })
      .expect(200);
    const statusChanges = (auditRes.body.items as AuditEntry[]).filter(
      (entry) => entry.action === 'status_change',
    );
    expect(statusChanges.length).toBeGreaterThanOrEqual(3);
  });

  it('BP3: creates project tasks and reads project/task risk assessments', async () => {
    const owner = await registerUser('bp3_owner', 'Owner3Pass!', 'BP3 Owner');
    const teamId = await createTeam(owner.accessToken, 'BP3 Team');
    const projectId = await createProject(
      owner.accessToken,
      teamId,
      'Risk Demo Project',
    );

    await createTask(owner.accessToken, projectId, 'Complex task', 5);
    await server()
      .post('/tasks')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        projectId,
        name: 'Simple task',
        deadline: deadlineIn(90),
        difficulty: 1,
      })
      .expect(201);

    const projectRisk = await server()
      .get(`/projects/${projectId}/risk`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    expect(projectRisk.body).toHaveProperty('riskScore');
    expect(projectRisk.body).toHaveProperty('riskLevel');
    expect(projectRisk.body).toHaveProperty('tasksAtRisk');
    expect(['low', 'medium', 'high']).toContain(projectRisk.body.riskLevel);

    const tasksRes = await server()
      .get('/tasks')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .query({ projectId })
      .expect(200);
    const firstTask = tasksRes.body.items[0] as IdResponse;

    const taskRisk = await server()
      .get(`/tasks/${firstTask.id}/risk`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    expect(taskRisk.body).toHaveProperty('delayProbability');
    expect(taskRisk.body).toHaveProperty('recommendation');
    expect(['low', 'medium', 'high']).toContain(taskRisk.body.riskLevel);
  });

  it('BP4: enforces project and team access rules across user roles', async () => {
    const owner = await registerUser('bp4_owner', 'Owner4Pass!', 'BP4 Owner');
    const member = await registerUser(
      'bp4_member',
      'Member4Pass!',
      'BP4 Member',
    );
    const observer = await registerUser(
      'bp4_observer',
      'Observer4Pass!',
      'BP4 Observer',
    );

    const teamId = await createTeam(owner.accessToken, 'BP4 Team');
    await addTeamMember(owner.accessToken, teamId, member.userId, 'member');
    const observerMembershipId = await addTeamMember(
      owner.accessToken,
      teamId,
      observer.userId,
      'observer',
    );
    const projectId = await createProject(
      owner.accessToken,
      teamId,
      'BP4 Project',
    );
    await addProjectMember(
      owner.accessToken,
      projectId,
      member.userId,
      'developer',
    );

    await server()
      .post('/tasks')
      .set('Authorization', `Bearer ${observer.accessToken}`)
      .send({
        projectId,
        name: 'Unauthorized task',
        deadline: deadlineIn(7),
        difficulty: 1,
      })
      .expect(403);
    await server()
      .get(`/projects/${projectId}/board-view`)
      .set('Authorization', `Bearer ${observer.accessToken}`)
      .expect(403);
    await server()
      .delete(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .expect(403);
    await server().get('/dashboard/summary').expect(401);

    const admin = await loginUser(ADMIN_LOGIN, ADMIN_PASSWORD);
    const projects = await server()
      .get('/projects')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);
    const projectIds = (projects.body.items as IdResponse[]).map((p) => p.id);
    expect(projectIds).toContain(projectId);

    await server()
      .patch(`/teams/${teamId}/members/${observerMembershipId}`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({ teamRole: 'member' })
      .expect(403);
  });

  it('BP5: revokes project membership and immediately hides cached summaries', async () => {
    const owner = await registerUser('bp5_owner', 'Owner5Pass!', 'BP5 Owner');
    const observer = await registerUser(
      'bp5_observer',
      'Observer5Pass!',
      'BP5 Observer',
    );
    const teamId = await createTeam(owner.accessToken, 'BP5 Team');
    await addTeamMember(owner.accessToken, teamId, observer.userId, 'observer');
    const projectId = await createProject(
      owner.accessToken,
      teamId,
      'BP5 Project',
    );
    const projectMemberId = await addProjectMember(
      owner.accessToken,
      projectId,
      observer.userId,
      'observer',
    );
    await createTask(owner.accessToken, projectId, 'BP5 Cached Task', 2);

    const projectsBefore = await server()
      .get('/reports/projects')
      .set('Authorization', `Bearer ${observer.accessToken}`)
      .expect(200);
    expect(projectsBefore.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: projectId, teamId }),
      ]),
    );

    const dashboardBefore = await server()
      .get('/dashboard/summary')
      .set('Authorization', `Bearer ${observer.accessToken}`)
      .expect(200);
    expect(dashboardBefore.body.overview.projectCount).toBe(1);
    expect(dashboardBefore.body.overview.totalTasks).toBe(1);

    await server()
      .delete(`/projects/${projectId}/members/${projectMemberId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(204);

    const projectsAfter = await server()
      .get('/projects')
      .set('Authorization', `Bearer ${observer.accessToken}`)
      .expect(200);
    expect(projectsAfter.body.items).toEqual([]);

    const dashboardAfter = await server()
      .get('/dashboard/summary')
      .set('Authorization', `Bearer ${observer.accessToken}`)
      .expect(200);
    expect(dashboardAfter.body.overview.projectCount).toBe(0);
    expect(dashboardAfter.body.overview.totalTasks).toBe(0);

    await server()
      .get('/reports/projects')
      .set('Authorization', `Bearer ${observer.accessToken}`)
      .expect(403);
    await server()
      .get('/reports/summary')
      .set('Authorization', `Bearer ${observer.accessToken}`)
      .expect(403);
  });
});
