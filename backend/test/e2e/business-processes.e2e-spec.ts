/**
 * E2E-тесты: три сквозных бизнес-процесса.
 *
 * БП1: register → login → create team → create project → assign → create task → audit
 * БП2: login → create task → assign → статусы → audit
 * БП3: login → проект + задачи → GET /projects/:id/risk
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import request from 'supertest';
import { App } from 'supertest/types';
import * as fs from 'fs';
import * as path from 'path';
import * as argon2 from 'argon2';
import { AppModule } from '../../src/app.module';
import { GlobalExceptionFilter } from '../../src/common/filters/global-exception.filter';

const DATA_DIR = path.join(process.cwd(), 'data');
const BACKUP_DIR = path.join(DATA_DIR, '_e2e_backup');
const JSON_FILES = [
  'users.json',
  'teams.json',
  'team_members.json',
  'projects.json',
  'project_members.json',
  'tasks.json',
  'audit_logs.json',
];

const ADMIN_LOGIN = 'e2e_admin';
const ADMIN_PASSWORD = 'AdminE2E1!';

function emptyJsonFile(entity: string): string {
  return JSON.stringify(
    { meta: { entity, lastId: 0 }, items: [] },
    null,
    2,
  );
}

function backupData(): void {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  for (const f of JSON_FILES) {
    const src = path.join(DATA_DIR, f);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(BACKUP_DIR, f));
    }
  }
}

function restoreData(): void {
  for (const f of JSON_FILES) {
    const bk = path.join(BACKUP_DIR, f);
    if (fs.existsSync(bk)) {
      fs.copyFileSync(bk, path.join(DATA_DIR, f));
    }
  }
  fs.rmSync(BACKUP_DIR, { recursive: true, force: true });
}

async function resetData(): Promise<void> {
  const hashedPassword = await argon2.hash(ADMIN_PASSWORD);

  // Pre-seed admin user (id=1) for audit log access
  fs.writeFileSync(
    path.join(DATA_DIR, 'users.json'),
    JSON.stringify({
      meta: { entity: 'users', lastId: 1 },
      items: [
        {
          id: 1,
          login: ADMIN_LOGIN,
          password: hashedPassword,
          fullName: 'E2E Admin',
          profession: 'Admin',
          accountStatus: 'active',
          accountRole: 'admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    }, null, 2),
    'utf-8',
  );

  for (const f of JSON_FILES) {
    if (f === 'users.json') continue;
    const entity = f.replace('.json', '');
    fs.writeFileSync(path.join(DATA_DIR, f), emptyJsonFile(entity), 'utf-8');
  }
}

/** Декодируем JWT payload без верификации (для тестов) */
function decodeJwtPayload(token: string): { sub: number; login: string; accountRole: string } {
  const base64 = token.split('.')[1];
  return JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
}

describe('Business Processes (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    backupData();
    await resetData();

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
    await app.close();
    restoreData();
  });

  // ─── Helpers ───

  const server = () => request(app.getHttpServer());

  async function registerUser(
    login: string,
    password: string,
    fullName: string,
  ) {
    const res = await server()
      .post('/auth/register')
      .send({ login, password, fullName, profession: 'Developer' })
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

  // ─── БП1: Полный цикл создания ───

  describe('БП1: register → login → team → project → assign → task → audit', () => {
    let token: string;
    let userId: number;
    let secondUserId: number;
    let secondToken: string;
    let teamId: number;
    let projectId: number;

    it('Шаг 1: Регистрация пользователя owner1', async () => {
      const result = await registerUser('owner1', 'Owner1Pass!', 'Владелец Один');
      token = result.accessToken;
      userId = result.userId;
      expect(userId).toBeDefined();
      expect(token).toBeDefined();
    });

    it('Шаг 2: Регистрация второго пользователя dev1', async () => {
      const result = await registerUser('dev1', 'Dev1Pass!!', 'Разработчик Один');
      secondToken = result.accessToken;
      secondUserId = result.userId;
      expect(secondUserId).toBeDefined();
    });

    it('Шаг 3: Повторный вход owner1', async () => {
      const result = await loginUser('owner1', 'Owner1Pass!');
      token = result.accessToken;
      expect(result.userId).toBe(userId);
    });

    it('Шаг 4: Создание команды', async () => {
      const res = await server()
        .post('/teams')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Alpha Team', description: 'Команда проекта' })
        .expect(201);

      teamId = res.body.id;
      expect(teamId).toBeDefined();
      expect(res.body.name).toBe('Alpha Team');
    });

    it('Шаг 5: Добавление dev1 в команду', async () => {
      const res = await server()
        .post(`/teams/${teamId}/members`)
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: secondUserId, teamRole: 'member' })
        .expect(201);

      expect(res.body.userId).toBe(secondUserId);
      expect(res.body.teamRole).toBe('member');
    });

    it('Шаг 6: Создание проекта', async () => {
      const res = await server()
        .post('/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ teamId, name: 'MVP Project', description: 'Минимальный продукт' })
        .expect(201);

      projectId = res.body.id;
      expect(projectId).toBeDefined();
      expect(res.body.name).toBe('MVP Project');
    });

    it('Шаг 7: Назначение dev1 в проект', async () => {
      const res = await server()
        .post(`/projects/${projectId}/members`)
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: secondUserId, role: 'developer' })
        .expect(201);

      expect(res.body.userId).toBe(secondUserId);
      expect(res.body.role).toBe('developer');
    });

    it('Шаг 8: Создание задачи с назначением на dev1', async () => {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 14);

      const res = await server()
        .post('/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          projectId,
          name: 'Реализовать авторизацию',
          description: 'JWT access + refresh',
          deadline: deadline.toISOString(),
          difficulty: 3,
          assigneeId: secondUserId,
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe('Реализовать авторизацию');
      expect(res.body.assigneeId).toBe(secondUserId);
    });

    it('Шаг 9: Проверка записей аудита (admin role required)', async () => {
      const adminLogin = await loginUser(ADMIN_LOGIN, ADMIN_PASSWORD);

      const res = await server()
        .get('/audit-logs')
        .set('Authorization', `Bearer ${adminLogin.accessToken}`)
        .expect(200);

      expect(res.body.items.length).toBeGreaterThan(0);

      // Verify at least one audit entry has entityType 'task'
      const taskAudit = res.body.items.find(
        (l: { entityType: string }) => l.entityType === 'task',
      );
      expect(taskAudit).toBeDefined();
    });
  });

  // ─── БП2: Жизненный цикл задачи ───

  describe('БП2: login → task → assign → status changes → audit', () => {
    let ownerToken: string;
    let ownerId: number;
    let devToken: string;
    let devId: number;
    let teamId: number;
    let projectId: number;
    let taskId: number;

    it('Шаг 1: Регистрация owner & dev', async () => {
      const owner = await registerUser('bp2_owner', 'Owner2Pass!', 'BP2 Owner');
      ownerToken = owner.accessToken;
      ownerId = owner.userId;

      const dev = await registerUser('bp2_dev', 'Dev2Pass!!!', 'BP2 Dev');
      devToken = dev.accessToken;
      devId = dev.userId;
    });

    it('Шаг 2: Создание команды и проекта', async () => {
      // Create team
      let res = await server()
        .post('/teams')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'BP2 Team' })
        .expect(201);
      teamId = res.body.id;

      // Add dev to team
      await server()
        .post(`/teams/${teamId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ userId: devId, teamRole: 'member' })
        .expect(201);

      // Create project
      res = await server()
        .post('/projects')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ teamId, name: 'BP2 Project' })
        .expect(201);
      projectId = res.body.id;

      // Add dev to project
      await server()
        .post(`/projects/${projectId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ userId: devId, role: 'developer' })
        .expect(201);
    });

    it('Шаг 3: Создание задачи', async () => {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 7);

      const res = await server()
        .post('/tasks')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          projectId,
          name: 'Тестовая задача BP2',
          deadline: deadline.toISOString(),
          difficulty: 2,
        })
        .expect(201);

      taskId = res.body.id;
      expect(res.body.status).toBe('new');
    });

    it('Шаг 4: Назначение исполнителя', async () => {
      const res = await server()
        .patch(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ assigneeId: devId })
        .expect(200);

      expect(res.body.assigneeId).toBe(devId);
    });

    it('Шаг 5: Смена статуса new → in_progress (исполнитель)', async () => {
      const res = await server()
        .patch(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({ status: 'in_progress' })
        .expect(200);

      expect(res.body.status).toBe('in_progress');
    });

    it('Шаг 6: Смена статуса in_progress → review', async () => {
      const res = await server()
        .patch(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({ status: 'review' })
        .expect(200);

      expect(res.body.status).toBe('review');
    });

    it('Шаг 7: Смена статуса review → done (owner)', async () => {
      const res = await server()
        .patch(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: 'done' })
        .expect(200);

      expect(res.body.status).toBe('done');
    });

    it('Шаг 8: Недопустимый переход done → in_progress', async () => {
      await server()
        .patch(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: 'in_progress' })
        .expect(400);
    });

    it('Шаг 9: Проверка аудита статусных переходов', async () => {
      const adminLogin = await loginUser(ADMIN_LOGIN, ADMIN_PASSWORD);

      const res = await server()
        .get('/audit-logs')
        .set('Authorization', `Bearer ${adminLogin.accessToken}`)
        .query({ entityType: 'task' })
        .expect(200);

      const statusChanges = res.body.items.filter(
        (l: { action: string }) => l.action === 'status_change',
      );
      expect(statusChanges.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ─── БП3: Оценка рисков проекта ───

  describe('БП3: login → project + tasks → GET /projects/:id/risk', () => {
    let ownerToken: string;
    let ownerId: number;
    let teamId: number;
    let projectId: number;

    it('Шаг 1: Регистрация и настройка', async () => {
      const owner = await registerUser('bp3_owner', 'Owner3Pass!', 'BP3 Owner');
      ownerToken = owner.accessToken;
      ownerId = owner.userId;

      // Create team
      const teamRes = await server()
        .post('/teams')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'BP3 Team' })
        .expect(201);
      teamId = teamRes.body.id;

      // Create project
      const projRes = await server()
        .post('/projects')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ teamId, name: 'Risk Demo Project' })
        .expect(201);
      projectId = projRes.body.id;
    });

    it('Шаг 2: Создание задач с разной сложностью', async () => {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 3); // Tight deadline

      // High-difficulty task with tight deadline
      await server()
        .post('/tasks')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          projectId,
          name: 'Сложная задача',
          deadline: deadline.toISOString(),
          difficulty: 5,
        })
        .expect(201);

      const farDeadline = new Date();
      farDeadline.setDate(farDeadline.getDate() + 90);

      // Easy task
      await server()
        .post('/tasks')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          projectId,
          name: 'Простая задача',
          deadline: farDeadline.toISOString(),
          difficulty: 1,
        })
        .expect(201);
    });

    it('Шаг 3: GET /projects/:id/risk — оценка рисков', async () => {
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

    it('Шаг 4: GET /tasks/:id/risk — оценка рисков конкретной задачи', async () => {
      // Get list of tasks for this project
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
});
