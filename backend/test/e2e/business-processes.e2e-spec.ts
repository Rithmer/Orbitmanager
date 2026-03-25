/**
 * E2E tests for the core business processes.
 *
 * BP1: register -> login -> create team -> create project -> assign -> create task -> audit
 * BP2: login -> create task -> assign -> statuses -> audit
 * BP3: login -> project + tasks -> GET /projects/:id/risk
 */
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

async function updateUserStatus(userId: number, status: 'active' | 'blocked') {
  await withDatabaseClient(async (client) => {
    await client.query(
      `
        UPDATE users
        SET account_status = $2,
            updated_at = NOW()
        WHERE id = $1
      `,
      [userId, status],
    );
  });
}

async function clearUserAuditLogs(userId: number) {
  await withDatabaseClient(async (client) => {
    await client.query('DELETE FROM audit_logs WHERE user_id = $1', [userId]);
  });
}

async function insertRawUser(
  login: string,
  password: string,
  fullName: string,
): Promise<number> {
  const hashedPassword = await argon2.hash(password);

  return withDatabaseClient(async (client) => {
    const result = await client.query<{ id: number }>(
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
        VALUES ($1, $2, $3, $4, 'active', 'member', NOW(), NOW())
        RETURNING id
      `,
      [login, hashedPassword, fullName, 'Developer'],
    );

    return result.rows[0].id;
  });
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
  ) {
    const res = await server()
      .post('/auth/register')
      .send({ login, password, fullName, profession })
      .expect(201);
    const body = res.body as { accessToken: string; refreshToken: string };
    const payload = decodeJwtPayload(body.accessToken);
    return { ...body, userId: payload.sub };
  }

  async function loginUser(login: string, password: string) {
    const res = await server()
      .post('/auth/login')
      .send({ login, password })
      .expect(200);
    const body = res.body as { accessToken: string; refreshToken: string };
    const payload = decodeJwtPayload(body.accessToken);
    return { ...body, userId: payload.sub };
  }

  describe('BP0: contract regression fixes', () => {
    it('registers a user without profession', async () => {
      const result = await registerUser(
        'bp0_noprof',
        'NoProfPass1!',
        'No Profession',
      );

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('rejects inactive accountStatus on admin create and update', async () => {
      const admin = await loginUser(ADMIN_LOGIN, ADMIN_PASSWORD);

      await server()
        .post('/users')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({
          login: 'bp0_inactive_create',
          password: 'CreatePass1!',
          fullName: 'Inactive Create',
          accountStatus: 'inactive',
        })
        .expect(400);

      const created = await server()
        .post('/users')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({
          login: 'bp0_active_user',
          password: 'CreatePass2!',
          fullName: 'Active User',
        })
        .expect(201);

      await server()
        .patch(`/users/${created.body.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ accountStatus: 'inactive' })
        .expect(400);
    });
  });

  describe('BP1: register -> login -> team -> project -> assign -> task -> audit', () => {
    let token: string;
    let userId: number;
    let secondUserId: number;
    let teamId: number;
    let projectId: number;

    it('Step 1: register owner1', async () => {
      const result = await registerUser('owner1', 'Owner1Pass!', 'Owner One');
      token = result.accessToken;
      userId = result.userId;
      expect(userId).toBeDefined();
      expect(token).toBeDefined();
    });

    it('Step 2: register dev1', async () => {
      const result = await registerUser('dev1', 'Dev1Pass!!', 'Developer One');
      secondUserId = result.userId;
      expect(secondUserId).toBeDefined();
    });

    it('Step 3: login owner1 again', async () => {
      const result = await loginUser('owner1', 'Owner1Pass!');
      token = result.accessToken;
      expect(result.userId).toBe(userId);
    });

    it('Step 4: create team', async () => {
      const res = await server()
        .post('/teams')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Alpha Team', description: 'Project team' })
        .expect(201);

      teamId = res.body.id;
      expect(teamId).toBeDefined();
      expect(res.body.name).toBe('Alpha Team');
    });

    it('Step 5: add dev1 to the team', async () => {
      const res = await server()
        .post(`/teams/${teamId}/members`)
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: secondUserId, teamRole: 'member' })
        .expect(201);

      expect(res.body.userId).toBe(secondUserId);
      expect(res.body.teamRole).toBe('member');
    });

    it('Step 6: create project', async () => {
      const res = await server()
        .post('/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({
          teamId,
          name: 'MVP Project',
          description: 'Minimum viable product',
        })
        .expect(201);

      projectId = res.body.id;
      expect(projectId).toBeDefined();
      expect(res.body.name).toBe('MVP Project');
    });

    it('Step 7: assign dev1 to the project', async () => {
      const res = await server()
        .post(`/projects/${projectId}/members`)
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: secondUserId, role: 'developer' })
        .expect(201);

      expect(res.body.userId).toBe(secondUserId);
      expect(res.body.role).toBe('developer');
    });

    it('Step 8: create task assigned to dev1', async () => {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 14);

      const res = await server()
        .post('/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          projectId,
          name: 'Implement authentication',
          description: 'JWT access + refresh',
          deadline: deadline.toISOString(),
          difficulty: 3,
          assigneeIds: [secondUserId],
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe('Implement authentication');
      expect(res.body.assigneeIds).toContain(secondUserId);
    });

    it('Step 9: verify audit entries with admin account', async () => {
      const adminLogin = await loginUser(ADMIN_LOGIN, ADMIN_PASSWORD);

      const res = await server()
        .get('/audit-logs')
        .set('Authorization', `Bearer ${adminLogin.accessToken}`)
        .expect(200);

      expect(res.body.items.length).toBeGreaterThan(0);

      const taskAudit = res.body.items.find(
        (entry: { entityType: string }) => entry.entityType === 'task',
      );
      expect(taskAudit).toBeDefined();
    });
  });

  describe('BP2: login -> task -> assign -> status changes -> audit', () => {
    let ownerToken: string;
    let devToken: string;
    let devId: number;
    let teamId: number;
    let projectId: number;
    let taskId: number;

    it('Step 1: register owner and dev', async () => {
      const owner = await registerUser('bp2_owner', 'Owner2Pass!', 'BP2 Owner');
      ownerToken = owner.accessToken;

      const dev = await registerUser('bp2_dev', 'Dev2Pass!!!', 'BP2 Dev');
      devToken = dev.accessToken;
      devId = dev.userId;
    });

    it('Step 2: create team and project', async () => {
      let res = await server()
        .post('/teams')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'BP2 Team' })
        .expect(201);
      teamId = res.body.id;

      await server()
        .post(`/teams/${teamId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ userId: devId, teamRole: 'member' })
        .expect(201);

      res = await server()
        .post('/projects')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ teamId, name: 'BP2 Project' })
        .expect(201);
      projectId = res.body.id;

      await server()
        .post(`/projects/${projectId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ userId: devId, role: 'developer' })
        .expect(201);
    });

    it('Step 3: create task', async () => {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 7);

      const res = await server()
        .post('/tasks')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          projectId,
          name: 'BP2 test task',
          deadline: deadline.toISOString(),
          difficulty: 2,
        })
        .expect(201);

      taskId = res.body.id;
      expect(res.body.status).toBe('new');
    });

    it('Step 4: assign task to dev', async () => {
      const res = await server()
        .patch(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ assigneeIds: [devId] })
        .expect(200);

      expect(res.body.assigneeIds).toContain(devId);
    });

    it('Step 5: move status new -> in_progress', async () => {
      const res = await server()
        .patch(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({ status: 'in_progress' })
        .expect(200);

      expect(res.body.status).toBe('in_progress');
    });

    it('Step 6: move status in_progress -> review', async () => {
      const res = await server()
        .patch(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({ status: 'review' })
        .expect(200);

      expect(res.body.status).toBe('review');
    });

    it('Step 7: move status review -> done', async () => {
      const res = await server()
        .patch(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: 'done' })
        .expect(200);

      expect(res.body.status).toBe('done');
    });

    it('Step 8: reject invalid status transition done -> in_progress', async () => {
      await server()
        .patch(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: 'in_progress' })
        .expect(422);
    });

    it('Step 9: verify audit log for status changes', async () => {
      const adminLogin = await loginUser(ADMIN_LOGIN, ADMIN_PASSWORD);

      const res = await server()
        .get('/audit-logs')
        .set('Authorization', `Bearer ${adminLogin.accessToken}`)
        .query({ entityType: 'task' })
        .expect(200);

      const statusChanges = res.body.items.filter(
        (entry: { action: string }) => entry.action === 'status_change',
      );
      expect(statusChanges.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('BP3: login -> project + tasks -> GET /projects/:id/risk', () => {
    let ownerToken: string;
    let teamId: number;
    let projectId: number;

    it('Step 1: register and set up project', async () => {
      const owner = await registerUser('bp3_owner', 'Owner3Pass!', 'BP3 Owner');
      ownerToken = owner.accessToken;

      const teamRes = await server()
        .post('/teams')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'BP3 Team' })
        .expect(201);
      teamId = teamRes.body.id;

      const projectRes = await server()
        .post('/projects')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ teamId, name: 'Risk Demo Project' })
        .expect(201);
      projectId = projectRes.body.id;
    });

    it('Step 2: create tasks with different risk profiles', async () => {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 3);

      await server()
        .post('/tasks')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          projectId,
          name: 'Complex task',
          deadline: deadline.toISOString(),
          difficulty: 5,
        })
        .expect(201);

      const farDeadline = new Date();
      farDeadline.setDate(farDeadline.getDate() + 90);

      await server()
        .post('/tasks')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          projectId,
          name: 'Simple task',
          deadline: farDeadline.toISOString(),
          difficulty: 1,
        })
        .expect(201);
    });

    it('Step 3: fetch project risk assessment', async () => {
      const res = await server()
        .get(`/projects/${projectId}/risk`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('riskScore');
      expect(res.body).toHaveProperty('riskLevel');
      expect(res.body).toHaveProperty('tasksAtRisk');
      expect(res.body).toHaveProperty('summary');
      expect(['low', 'medium', 'high']).toContain(res.body.riskLevel);
      expect(typeof res.body.riskScore).toBe('number');
      expect(Array.isArray(res.body.tasksAtRisk)).toBe(true);
    });

    it('Step 4: fetch single task risk assessment', async () => {
      const tasksRes = await server()
        .get('/tasks')
        .set('Authorization', `Bearer ${ownerToken}`)
        .query({ projectId })
        .expect(200);

      const firstTask = tasksRes.body.items[0];
      expect(firstTask).toBeDefined();

      const res = await server()
        .get(`/tasks/${firstTask.id}/risk`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('riskLevel');
      expect(res.body).toHaveProperty('delayProbability');
      expect(res.body).toHaveProperty('riskFactors');
      expect(res.body).toHaveProperty('recommendation');
      expect(['low', 'medium', 'high']).toContain(res.body.riskLevel);
      expect(typeof res.body.delayProbability).toBe('number');
    });
  });

  describe('BP4: RBAC Access Control', () => {
    let ownerToken: string;
    let memberToken: string;
    let observerToken: string;
    let memberId: number;
    let observerMembershipId: number;
    let teamId: number;
    let projectId: number;

    beforeAll(async () => {
      // Register three users for RBAC testing
      const owner = await registerUser(
        'rbac_owner',
        'RbacOwner1!',
        'RBAC Owner',
      );
      ownerToken = owner.accessToken;

      const member = await registerUser(
        'rbac_member',
        'RbacMember1!',
        'RBAC Member',
      );
      memberToken = member.accessToken;
      memberId = member.userId;

      const observer = await registerUser(
        'rbac_observer',
        'RbacObserver1!',
        'RBAC Observer',
      );
      observerToken = observer.accessToken;
      const observerUserId = observer.userId;

      // Owner creates a team
      const teamRes = await server()
        .post('/teams')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'RBAC Test Team' })
        .expect(201);
      teamId = teamRes.body.id;

      // Owner adds member to team with MEMBER role
      await server()
        .post(`/teams/${teamId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ userId: memberId, teamRole: 'member' })
        .expect(201);

      // Owner adds observer to team with OBSERVER role
      const observerTeamMemberRes = await server()
        .post(`/teams/${teamId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ userId: observerUserId, teamRole: 'observer' })
        .expect(201);
      observerMembershipId = observerTeamMemberRes.body.id;

      // Owner creates a project in the team
      const projectRes = await server()
        .post('/projects')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ teamId, name: 'RBAC Test Project' })
        .expect(201);
      projectId = projectRes.body.id;

      // Owner adds member to project with developer role (observer is NOT added)
      await server()
        .post(`/projects/${projectId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ userId: memberId, role: 'developer' })
        .expect(201);
    });

    it('observer cannot create a task in a project they are not member of', async () => {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 7);

      await server()
        .post('/tasks')
        .set('Authorization', `Bearer ${observerToken}`)
        .send({
          projectId,
          name: 'Unauthorized task',
          deadline: deadline.toISOString(),
          difficulty: 1,
        })
        .expect(403);
    });

    it('team observer without project access cannot view board', async () => {
      await server()
        .get(`/projects/${projectId}/board-view`)
        .set('Authorization', `Bearer ${observerToken}`)
        .expect(403);
    });

    it('team member (non-owner) cannot delete project', async () => {
      await server()
        .delete(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);
    });

    it('unauthenticated request returns 401 on protected endpoints', async () => {
      await server().get('/dashboard/summary').expect(401);
    });

    it('admin can access all projects regardless of membership', async () => {
      const adminLogin = await loginUser(ADMIN_LOGIN, ADMIN_PASSWORD);

      const res = await server()
        .get('/projects')
        .set('Authorization', `Bearer ${adminLogin.accessToken}`)
        .expect(200);

      const projectIds = (res.body.items as { id: number }[]).map(
        (p) => p.id,
      );
      expect(projectIds).toContain(projectId);
    });

    it('member cannot change team member roles', async () => {
      await server()
        .patch(`/teams/${teamId}/members/${observerMembershipId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ teamRole: 'member' })
        .expect(403);
    });
  });

  describe('Remediation regressions', () => {
    it('returns 401 on refresh for blocked user', async () => {
      const blocked = await registerUser(
        'refresh_blocked_user',
        'Blocked1Pass!',
        'Blocked User',
      );

      await updateUserStatus(blocked.userId, 'blocked');

      await server()
        .post('/auth/refresh')
        .send({ refreshToken: blocked.refreshToken })
        .expect(401);
    });

    it('returns 401 on refresh for deleted user', async () => {
      const rawUserId = await insertRawUser(
        'refresh_deleted_user',
        'Deleted1Pass!',
        'Deleted User',
      );
      const login = await loginUser('refresh_deleted_user', 'Deleted1Pass!');
      const admin = await loginUser(ADMIN_LOGIN, ADMIN_PASSWORD);

      await clearUserAuditLogs(rawUserId);

      await server()
        .delete(`/users/${rawUserId}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(204);

      await server()
        .post('/auth/refresh')
        .send({ refreshToken: login.refreshToken })
        .expect(401);
    });

    it('returns 409 when deleting a user with dependencies', async () => {
      const dependentUser = await registerUser(
        'delete_conflict_user',
        'Conflict1Pass!',
        'Conflict User',
      );
      const admin = await loginUser(ADMIN_LOGIN, ADMIN_PASSWORD);

      await server()
        .delete(`/users/${dependentUser.userId}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(409);
    });

    it('clears assignee after removing project member', async () => {
      const owner = await registerUser(
        'pm_owner_cleanup',
        'Owner4Pass!',
        'Cleanup Owner',
      );
      const developer = await registerUser(
        'pm_dev_cleanup',
        'Dev4Pass!!!',
        'Cleanup Dev',
      );

      const teamRes = await server()
        .post('/teams')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ name: 'Cleanup Team' })
        .expect(201);
      const teamId = teamRes.body.id as number;

      await server()
        .post(`/teams/${teamId}/members`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ userId: developer.userId, teamRole: 'member' })
        .expect(201);

      const projectRes = await server()
        .post('/projects')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ teamId, name: 'Cleanup Project' })
        .expect(201);
      const projectId = projectRes.body.id as number;

      await server()
        .post(`/projects/${projectId}/members`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ userId: developer.userId, role: 'developer' })
        .expect(201);

      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 10);

      const taskRes = await server()
        .post('/tasks')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({
          projectId,
          name: 'Cleanup task',
          deadline: deadline.toISOString(),
          difficulty: 2,
          assigneeIds: [developer.userId],
        })
        .expect(201);
      const taskId = taskRes.body.id as number;

      const membersRes = await server()
        .get(`/projects/${projectId}/members`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .expect(200);
      const membership = membersRes.body.find(
        (item: { userId: number }) => item.userId === developer.userId,
      );
      expect(membership).toBeDefined();

      await server()
        .delete(`/project-members/${membership.id}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .expect(204);

      const updatedTask = await server()
        .get(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .expect(200);

      expect(updatedTask.body.assigneeIds).toEqual([]);
    });
  });

  describe('BP5: membership revoke invalidates cached summaries immediately', () => {
    let ownerToken: string;
    let observerToken: string;
    let observerId: number;
    let teamId: number;
    let projectId: number;
    let projectMemberId: number;

    it('Step 1: register owner and observer', async () => {
      const owner = await registerUser(
        'bp5_owner',
        'Owner5Pass!',
        'BP5 Owner',
        'Owner',
      );
      ownerToken = owner.accessToken;

      const observer = await registerUser(
        'bp5_observer',
        'Observer5Pass!',
        'BP5 Observer',
        'Observer',
      );
      observerToken = observer.accessToken;
      observerId = observer.userId;
    });

    it('Step 2: create team, project and attach observer to the project', async () => {
      const teamRes = await server()
        .post('/teams')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'BP5 Team' })
        .expect(201);
      teamId = teamRes.body.id;

      await server()
        .post(`/teams/${teamId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ userId: observerId, teamRole: 'observer' })
        .expect(201);

      const projectRes = await server()
        .post('/projects')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ teamId, name: 'BP5 Project' })
        .expect(201);
      projectId = projectRes.body.id;

      const projectMemberRes = await server()
        .post(`/projects/${projectId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ userId: observerId, role: 'observer' })
        .expect(201);
      projectMemberId = projectMemberRes.body.id;
    });

    it('Step 3: create a task and warm cached summaries', async () => {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 5);

      await server()
        .post('/tasks')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          projectId,
          name: 'BP5 Cached Task',
          deadline: deadline.toISOString(),
          difficulty: 2,
        })
        .expect(201);

      const projectsRes = await server()
        .get('/reports/projects')
        .set('Authorization', `Bearer ${observerToken}`)
        .expect(200);

      expect(projectsRes.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: projectId,
            name: 'BP5 Project',
            teamId,
          }),
        ]),
      );

      const dashboardRes = await server()
        .get('/dashboard/summary')
        .set('Authorization', `Bearer ${observerToken}`)
        .expect(200);
      expect(dashboardRes.body.overview.projectCount).toBe(1);
      expect(dashboardRes.body.overview.totalTasks).toBe(1);

      const reportsRes = await server()
        .get('/reports/summary')
        .set('Authorization', `Bearer ${observerToken}`)
        .expect(200);
      expect(reportsRes.body.overview.projectCount).toBe(1);
      expect(reportsRes.body.overview.totalTasks).toBe(1);
    });

    it('Step 4: removes project access and invalidates cached summaries immediately', async () => {
      await server()
        .delete(`/projects/${projectId}/members/${projectMemberId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(204);

      const projectsRes = await server()
        .get('/projects')
        .set('Authorization', `Bearer ${observerToken}`)
        .expect(200);
      expect(projectsRes.body.items).toEqual([]);

      const dashboardRes = await server()
        .get('/dashboard/summary')
        .set('Authorization', `Bearer ${observerToken}`)
        .expect(200);
      expect(dashboardRes.body.overview.projectCount).toBe(0);
      expect(dashboardRes.body.overview.totalTasks).toBe(0);

      await server()
        .get('/reports/projects')
        .set('Authorization', `Bearer ${observerToken}`)
        .expect(403);

      await server()
        .get('/reports/summary')
        .set('Authorization', `Bearer ${observerToken}`)
        .expect(403);
    });
  });
});
