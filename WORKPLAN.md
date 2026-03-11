# План работ — Backend (NestJS + TypeScript)

> **Проект:** Сервис управления проектами и задачами  
> **Стек:** NestJS + TypeScript, JSON-файлы (с заглушками под PostgreSQL)  
> **Версия плана:** v3

---

## Оглавление

1. [Обзор этапов](#1-обзор-этапов)
2. [Этап 1 — Каркас проекта](#2-этап-1--каркас-проекта)
3. [Этап 2 — JSON Storage Layer](#3-этап-2--json-storage-layer)
4. [Этап 3 — Справочники + Auth + Users](#4-этап-3--справочники--auth--users)
5. [Этап 4 — Команды + Участники](#5-этап-4--команды--участники)
6. [Этап 5 — Проекты + Участники проекта + Задачи + БИ1](#6-этап-5--проекты--участники-проекта--задачи--бИ1)
7. [Этап 6 — Назначения + История + Аудит + БП2](#7-этап-6--назначения--история--аудит--бп2)
8. [Этап 7 — Risk / AI + БП3](#8-этап-7--risk--ai--бп3)
9. [Этап 8 — Финализация + Docker + Тесты](#9-этап-8--финализация--docker--тесты)
10. [Правила валидации](#10-правила-валидации)
11. [Допустимые переходы статусов](#11-допустимые-переходы-статусов)
12. [Фильтрация, поиск, пагинация](#12-фильтрация-поиск-пагинация)
13. [Risk Assessment — контракт ИИ-модуля](#13-risk-assessment--контракт-ии-модуля)
14. [Seed-данные](#14-seed-данные)
15. [Критерий «готово»](#15-критерий-готово)

---

## 1. Обзор этапов

| Этап | Название                             | Что создаётся                                           |
| :--: | ------------------------------------ | ------------------------------------------------------- |
|  1   | Каркас проекта                       | NestJS init, конфиг, глобальные фильтры, Swagger        |
|  2   | JSON Storage Layer                   | json-file.service, query.helper                         |
|  3   | Auth + Users                         | users, auth, JWT, guards                                |
|  4   | Команды + Участники                  | teams, team_members, TeamRolesGuard                     |
|  5   | Проекты + Участники проекта + Задачи + БИ1 | projects, project_members, tasks, ProjectRolesGuard, БИ1 |
|  6   | Аудит (+ история статусов) + БП2     | audit_logs (с oldValue/newValue), БП2                   |
|  7   | Risk / AI + БП3                      | risk module, stub-сервис, мониторинг, БП3               |
|  8   | Финализация                          | seed-скрипт, Swagger-проверка, e2e тесты, README        |

---

## 2. Этап 1 — Каркас проекта

### Цель
Создать работающий каркас NestJS с базовой инфраструктурой.

### Задачи

- [x] Инициализация проекта: `nest new project-name`
- [x] Настройка `tsconfig.json` (strict mode)
- [x] Настройка переменных окружения (`@nestjs/config`, env.validation.ts)
- [x] Глобальный `ValidationPipe`:
  ```typescript
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  ```
- [x] Глобальный `GlobalExceptionFilter` — единый формат ошибок:
  ```json
  {
    "statusCode": 400,
    "error": "ValidationError",
    "message": "...",
    "details": [],
    "timestamp": "..."
  }
  ```
- [x] Настройка Swagger/OpenAPI в `main.ts`:
  ```typescript
  const config = new DocumentBuilder()
    .setTitle('Task Management API')
    .setDescription('Сервис управления проектами и задачами')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, document);
  ```
- [x] Установка зависимостей: `helmet`, `@nestjs/throttler`, `cors`
- [x] Настройка Helmet и CORS
- [x] Настройка серверного логирования (Winston / NestJS Logger):
  - Уровни: `error`, `warn`, `info`, `debug`
  - `LoggingInterceptor` — лог каждого HTTP-запроса (method, url, status, время отклика)
  - Вывод: stdout (dev), JSON-файл `logs/app.log` (prod)
  - ⚠️ **Отклонение:** `nest-winston` и `winston` установлены, но не настроены. Используется встроенный NestJS Logger. Вывод в файл `logs/app.log` не реализован.
- [x] Создать `.env.example` с полным списком переменных окружения (включая DB_HOST, DB_PORT, STORAGE_MODE)

### Результат
Приложение запускается, Swagger доступен на `/api/docs`, ошибки приходят в едином JSON-формате, логи пишутся.

### Создаваемые файлы

```
src/main.ts
src/app.module.ts
src/config/env.validation.ts
src/common/filters/global-exception.filter.ts
src/common/exceptions/business.exception.ts
src/common/interceptors/logging.interceptor.ts
.env.example
```

---

## 3. Этап 2 — JSON Storage Layer

### Цель
Создать слой работы с JSON-файлами: чтение, запись, кэширование.

### Задачи

- [x] Создать папку `data/` и пустые JSON-файлы (7 шт.) с форматом:
  ```json
  {
    "meta": { "entity": "...", "lastId": 0 },
    "items": []
  }
  ```
- [x] `JsonFileService` — чтение/запись JSON с in-memory кэшем:
  - `read<T>(entity): Promise<JsonFile<T>>` — читает из кэша или файла
  - `write<T>(entity, data): Promise<void>` — атомарная запись (tmp → rename), инвалидация кэша
  - Auto-increment `lastId` при создании записи
  - Async-очередь для последовательной записи нескольких файлов
- [x] `QueryHelper` — фильтрация, поиск и пагинация по in-memory массивам:
  ```typescript
  interface QueryParams {
    search?: string;
    filters?: Record<string, any>;
    sort?: string;          // '-name' для DESC
    page?: number;          // default 1
    limit?: number;         // default 20, max 100
  }
  interface PaginatedResult<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
  ```

### Результат
Можно читать/писать любой JSON-файл атомарно; кэш ускоряет чтение.

### Создаваемые файлы

```
src/infrastructure/storage/json-file.service.ts
src/common/helpers/query.helper.ts
data/*.json (7 файлов)
```

---

## 4. Этап 3 — Auth + Users

### Цель
Реализовать авторизацию и пользователей (роли хранятся как enum-поля, без отдельных справочников).

### Задачи

#### Модели (domain/models/)

- [x] `User` — `{ id, login, password, fullName, profession, accountStatus, accountRole, createdAt, updatedAt }`

#### Enums (common/enums/)

- [x] `AccountRole` enum: `admin`, `member`, `guest`
- [x] `TeamRole` enum: `owner`, `member`, `observer`

#### Repository Interfaces (domain/repositories/)

- [x] `IUserRepository`: findAll, findById, findByLogin, create, update, delete

#### JSON Repositories (infrastructure/repositories/)

- [x] `UsersJsonRepository` implements `IUserRepository`

#### Модуль users

- [x] CRUD-контроллер с DTO
- [x] Сервис: уникальность login, валидация accountRole через enum, хэширование пароля
- [x] Swagger-декораторы

#### Модуль auth

- [x] `POST /auth/register` — создание пользователя (guest → member)
- [x] `POST /auth/login` — проверка credentials, выдача access + refresh JWT
- [x] `POST /auth/refresh` — обновление токенов
- [x] Хэширование: argon2
- [x] JWT: access (15 мин) + refresh (7 дней)

#### Guards

- [x] `JwtAuthGuard` — проверка валидности токена
- [x] `AccountRolesGuard` — проверка `admin` / `member` / `guest`
- [x] Декоратор `@Roles(AccountRole.ADMIN)` 
- [x] Декоратор `@CurrentUser()` — извлечение пользователя из JWT

### Результат
Работает auth (register, login, refresh), CRUD пользователей, JWT-защита endpoint-ов.

### Создаваемые файлы

```
src/domain/models/user.model.ts
src/domain/repositories/user.repository.ts
src/infrastructure/repositories/users.json.repository.ts
src/modules/auth/** (controller, service, module, dto/)
src/modules/users/** (controller, service, module, dto/)
src/common/guards/jwt-auth.guard.ts
src/common/guards/account-roles.guard.ts
src/common/decorators/roles.decorator.ts
src/common/decorators/current-user.decorator.ts
```

---

## 5. Этап 4 — Команды + Участники

### Цель
Реализовать команды, управление составом и командными ролями.

### Задачи

#### Модели

- [x] `Team` — `{ id, name, description, createdAt, createdById }`
- [x] `TeamMember` — `{ id, userId, teamId, teamRole }`

#### Repository Interfaces

- [x] `ITeamRepository`: findAll, findById, create, update, delete
- [x] `ITeamMemberRepository`: findAll, findByTeam, findByUser, findByUserAndTeam, create, update, delete

#### JSON Repositories

- [x] `TeamsJsonRepository`
- [x] `TeamMembersJsonRepository`

#### Модуль teams

- [x] CRUD-контроллер с DTO
- [x] Сервис:
  - При создании команды **автоматически** добавлять создателя как `owner` (team_members)
  - Удалять команду может только owner
  - Редактировать — только owner
- [x] Swagger-декораторы

#### Управление участниками (в модуле teams)

- [x] `GET /teams/:teamId/members` — список участников
- [x] `POST /teams/:teamId/members` — добавить участника (только owner)
- [x] `PATCH /team-members/:id` — изменить роль в команде (только owner)
- [x] `DELETE /team-members/:id` — удалить из команды (только owner)
- [x] Сервис:
  - Валидация: `UNIQUE(userId, teamId)`
  - Валидация: `teamRole` принадлежит TeamRole enum
  - Нельзя удалить единственного owner
  - При удалении из команды — каскадное удаление из project_members
  - ⚠️ **Отклонение:** каскадное удаление `project_members` реализовано через прямой доступ к `JsonFileService`, обходя паттерн репозиториев (будет рефакторизовано при реализации Этапа 5)

#### TeamRolesGuard

- [x] `TeamRolesGuard` — проверяет роль пользователя в конкретной команде
  - ⚠️ **Отклонение:** Guard создан и работает, но не применяется декоратором `@TeamRoles()` в контроллерах. Права проверяются в `TeamsService.assertOwnerOrAdmin()`.
- [x] Логика:
  - `owner`: полный доступ ко всей команде
  - `member`: видит все проекты, работает только в назначенных (через project_members)
  - `observer`: видит только назначенные проекты (через project_members)

### Результат
CRUD команд, управление участниками, авто-создание owner, TeamRolesGuard.

### Создаваемые файлы

```
src/domain/models/team.model.ts
src/domain/models/team-member.model.ts
src/domain/repositories/team.repository.ts
src/domain/repositories/team-member.repository.ts
src/infrastructure/repositories/teams.json.repository.ts
src/infrastructure/repositories/team-members.json.repository.ts
src/modules/teams/** (controller, team-members.controller, service, module, dto/)
src/common/guards/team-roles.guard.ts
```

---

## 6. Этап 5 — Проекты + Участники проекта + Задачи + БП1

### Цель
Реализовать проекты, участников проекта, задачи, ProjectRolesGuard и первый бизнес-процесс «Создание и планирование задачи».

### Задачи

#### Модели

- [ ] `Project` — `{ id, teamId, name, description, status, createdAt, updatedAt }`
- [ ] `ProjectMember` — `{ id, projectId, userId, role, assignedAt }`
- [ ] `Task` — `{ id, projectId, name, description, deadline, status, difficulty, assigneeId, createdById, createdAt, updatedAt }`

#### Enums

- [ ] `ProjectStatus`: `active`, `on_hold`, `completed`, `archived`
- [ ] `ProjectRole`: `team_lead`, `developer`, `observer`
- [ ] `TaskStatus`: `new`, `in_progress`, `review`, `done`, `cancelled`

#### Repository Interfaces + JSON Repositories

- [ ] `IProjectRepository` + `ProjectsJsonRepository`
- [ ] `IProjectMemberRepository` + `ProjectMembersJsonRepository`
- [ ] `ITaskRepository` + `TasksJsonRepository`

#### Модуль projects

- [ ] CRUD-контроллер с DTO
- [ ] Сервис:
  - Создание: только `owner`
  - Редактирование: `owner` или `team_lead` (своего проекта)
  - Удаление: только `owner`
  - Валидация: `teamId` существует
  - Фильтрация: `?teamId=`, `?status=`, `?search=`, `?page=`, `?limit=`, `?sort=`
  - Видимость: `member` видит все проекты команды; `observer` — только назначенные
- [ ] Swagger-декораторы

#### Управление участниками проекта (в модуле projects)

- [ ] `GET /projects/:projectId/members` — список участников проекта
- [ ] `POST /projects/:projectId/members` — назначить в проект (только owner)
- [ ] `PATCH /project-members/:id` — изменить проектную роль (только owner)
- [ ] `DELETE /project-members/:id` — убрать из проекта (только owner)
- [ ] Сервис:
  - Валидация: `UNIQUE(projectId, userId)`
  - Валидация: пользователь — участник команды, которой принадлежит проект
  - Валидация: `member` команды → role = `team_lead` или `developer`
  - Валидация: `observer` команды → role = `observer`
  - Для observer: видит участников **только** назначенных ему проектов

#### Модуль tasks

- [ ] CRUD-контроллер с DTO
- [ ] Сервис:
  - Создание: `owner` или `team_lead` (своего проекта)
  - `deadline ≥ createdAt`
  - `difficulty` в диапазоне 1..5
  - `projectId` существует
  - `createdById` из JWT
  - `assigneeId` — если задан, проверка что пользователь — участник проекта (project_members)
  - Фильтрация: `?projectId=`, `?status=`, `?difficulty=`, `?assigneeId=`, `?search=`, `?page=`, `?limit=`, `?sort=`
- [ ] Swagger-декораторы

#### ProjectRolesGuard

- [ ] `ProjectRolesGuard` — проверяет роль пользователя в конкретном проекте (через project_members)
- [ ] Логика:
  - `owner` команды — автоматически проходит (не нужна запись в project_members)
  - `team_lead` — полный доступ к задачам и назначениям своего проекта
  - `developer` — видит все задачи проекта, меняет статус только своих
  - `observer` — только чтение

#### Бизнес-процесс 1 — Создание задачи

- [ ] Полный flow:
  1. Проверка прав (owner / team_lead своего проекта)
  2. Проверка существования проекта
  3. Валидация: `deadline > now`
  4. Валидация: `difficulty` 1–5
  5. Создание записи task с `createdById` из JWT
  6. Запись в `audit_logs`: action=`create`, entityType=`task`

### Результат
CRUD проектов и задач, управление участниками проекта, ProjectRolesGuard, БП1 полностью работает через API.

### Создаваемые файлы

```
src/domain/models/project.model.ts
src/domain/models/project-member.model.ts
src/domain/models/task.model.ts
src/domain/repositories/project.repository.ts
src/domain/repositories/project-member.repository.ts
src/domain/repositories/task.repository.ts
src/infrastructure/repositories/projects.json.repository.ts
src/infrastructure/repositories/project-members.json.repository.ts
src/infrastructure/repositories/tasks.json.repository.ts
src/modules/projects/** (controller, project-members.controller, service, module, dto/)
src/modules/tasks/** (controller, service, module, dto/)
src/common/guards/project-roles.guard.ts
src/common/enums/project-status.enum.ts
src/common/enums/project-role.enum.ts
src/common/enums/task-status.enum.ts
```

---

## 7. Этап 6 — Аудит (+ история статусов) + БП2

### Цель
Реализовать журнал аудита (включая автоматическую историю смены статусов) и второй бизнес-процесс.

### Задачи

#### Модели

- [ ] `AuditLog` — `{ id, userId, action, entityType, entityId, oldValue, newValue, timestamp, description }`

#### Enums

- [ ] `AuditAction`: `create`, `update`, `delete`, `login`, `logout`, `assign`, `status_change`

#### Repository Interfaces + JSON Repositories

- [ ] `IAuditLogRepository` + `AuditLogsJsonRepository`

#### Модуль audit-logs (только GET)

- [ ] `GET /audit-logs` — с фильтрацией: `?userId=`, `?entityType=`, `?entityId=`, `?action=`, `?from=`, `?to=`
- [ ] `AuditService` — универсальный сервис записи:
  ```typescript
  async log(userId: number, action: AuditAction, entityType: string, entityId: number | null, description?: string): Promise<void>
  ```
- [ ] Доступ: только `admin`

#### Бизнес-процесс 2 — Изменение статуса задачи

- [ ] Полный flow:
  1. Проверка прав (owner / team_lead / developer если assigneeId = текущий пользователь)
  2. Проверка допустимого перехода статуса
  3. **Последовательная запись:**
     - Обновление `task.status` + `task.updatedAt`
     - Запись в `audit_logs`: action=`status_change`, entityType=`task`, oldValue=старый статус, newValue=новый статус
  4. Вызов `riskService.assessTask()` для пересчёта риска

#### Допустимые переходы статусов задач

```
new         → [in_progress, cancelled]
in_progress → [review, cancelled]
review      → [done, in_progress]        ← возврат на доработку
done        → []                          ← финальный статус
cancelled   → [new]                       ← переоткрытие
```

### Результат
Аудит фиксирует все действия (включая историю статусов через oldValue/newValue); БП2 работает через API.

### Создаваемые файлы

```
src/domain/models/audit-log.model.ts
src/domain/repositories/audit-log.repository.ts
src/infrastructure/repositories/audit-logs.json.repository.ts
src/modules/audit-logs/** (controller, audit.service, module)
src/common/enums/audit-action.enum.ts
src/common/interceptors/audit.interceptor.ts
```

---

## 8. Этап 7 — Risk / AI + БП3

### Цель
Реализовать модуль оценки рисков (stub + подготовка ML) и третий бизнес-процесс «Мониторинг и прогнозирование».

### Задачи

#### Интерфейс сервиса

- [ ] `IRiskAssessmentService`:
  ```typescript
  interface IRiskAssessmentService {
    assessTask(input: TaskRiskInput): Promise<TaskRiskOutput>;
    assessProject(projectId: number): Promise<ProjectRiskOutput>;
  }
  ```

#### Входные/выходные данные

- [ ] `TaskRiskInput`:
  ```typescript
  interface TaskRiskInput {
    taskId: number;
    difficulty: number;           // 1..5
    deadline: string;             // ISO datetime
    createdAt: string;
    status: string;
    assigneeCount: number;
    assigneeLoad: number;         // кол-во активных задач исполнителя (0 если нет)
    statusChangesCount: number;
    daysSinceCreation: number;
    daysUntilDeadline: number;    // может быть отрицательным
  }
  ```
- [ ] `TaskRiskOutput`:
  ```typescript
  interface TaskRiskOutput {
    predictedCompletionDate: string;
    delayProbability: number;     // 0.0 — 1.0
    riskLevel: 'low' | 'medium' | 'high';
  }
  ```
- [ ] `ProjectRiskOutput`:
  ```typescript
  interface ProjectRiskOutput {
    riskScore: number;            // 0 — 100
    riskLevel: 'low' | 'medium' | 'high';
    tasksAtRisk: { taskId: number; taskName: string; delayProbability: number }[];
    summary: string;
  }
  ```

#### Stub-реализация (rule-based)

- [ ] `RiskStubService` implements `IRiskAssessmentService`:
  - Deadline прошёл → `delayProbability = 0.95`
  - ≤2 дня до deadline и статус не `review` → `0.7`
  - `difficulty ≥ 4` и нагрузка исполнителя > 5 задач → `0.6`
  - `difficulty ≥ 3` и ≤5 дней → `0.4`
  - Иначе → `0.1 + difficulty × 0.05`
  - Пороги riskLevel: `>0.6` → high (🔴), `>0.3` → medium (🟡), `≤0.3` → low (🟢)

#### Модуль risk

- [ ] `GET /projects/:id/risk` — оценка рисков проекта
- [ ] `GET /tasks/:id/risk` — оценка рисков задачи
- [ ] RiskController + RiskStubService
- [ ] Регистрация через DI (при подключении ML — просто заменить провайдер)

#### Бизнес-процесс 3 — Мониторинг

- [ ] Полный flow:
  1. Проверка прав (пользователь имеет доступ к проекту)
  2. Агрегация: все задачи проекта + аудит (статусы)
  3. Вызов `riskService.assessProject(projectId)`
  4. Формирование ответа: `riskScore`, `riskLevel`, `tasksAtRisk[]`, `summary`

### Результат
Endpoint-ы рисков возвращают stub-оценку; БП3 работает; интерфейс готов для замены на ML.

### Создаваемые файлы

```
src/domain/services/risk-assessment.interface.ts
src/common/enums/risk-level.enum.ts
src/modules/risk/risk.controller.ts
src/modules/risk/risk-stub.service.ts
src/modules/risk/risk.module.ts
src/modules/risk/dto/task-risk-output.dto.ts
src/modules/risk/dto/project-risk-output.dto.ts
scripts/generate-training-data.ts
```

#### Подготовка данных для будущего ML-обучения

- [ ] Скрипт `scripts/generate-training-data.ts`:
  - Генерация синтетических данных (≥ 1000 записей) на основе статистических распределений
  - Признаки: difficulty, deadline, status, assigneeCount, avgLoad, statusChanges
  - Метки: фактическое время завершения, флаг просрочки
  - Выход: `data/training_data.csv`
- [ ] Интерфейс `IRiskAssessmentService` с методом `loadModel()` для загрузки модели из файла
- [ ] Заглушка `POST /risk/retrain` (admin) — возвращает `{ message: "Retraining not implemented yet" }`

#### Результат интерпретации для пользователя

- [ ] `ProjectRiskOutput.summary` — текстовое пояснение: «Проект имеет высокий риск срыва сроков: 3 задачи с вероятностью задержки > 60%»
- [ ] `TaskRiskOutput.riskFactors` — массив ключевых причин («близкий дедлайн», «высокая сложность»)
- [ ] `TaskRiskOutput.recommendation` — краткий совет по снижению риска

#### Метрики качества (для будущей ML-модели)

| Задача                     | Метрики                              |
| -------------------------- | ---------------------------------------- |
| Регрессия (прогноз срока) | MAE, RMSE, R²                            |
| Классификация (срыв)    | Accuracy, Precision, Recall, F1, ROC-AUC |

Разделение данных: 80% train / 20% test.

#### Сохранение модели

- Файл: `models/risk-model.joblib` (или `.onnx`)
- При старте системы: загрузка из файла, если существует; иначе — fallback на stub

---

## 9. Этап 8 — Финализация + Docker + Тесты

### Цель
Подготовить проект к сдаче: контейнеризация, seed-данные, тесты, резервное копирование, документация.

### Задачи

#### Docker

- [ ] **Dockerfile** (мультистейдж):
  ```dockerfile
  # Build stage
  FROM node:20-alpine AS builder
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci
  COPY . .
  RUN npm run build

  # Production stage
  FROM node:20-alpine
  WORKDIR /app
  COPY --from=builder /app/dist ./dist
  COPY --from=builder /app/node_modules ./node_modules
  COPY --from=builder /app/package.json ./
  EXPOSE 3000
  CMD ["node", "dist/main.js"]
  ```
- [ ] **docker-compose.yml** — 3 контейнера:
  - `postgres` (postgres:16-alpine, намед volume `pgdata`, healthcheck)
  - `backend` (сборка из Dockerfile, depends_on postgres, маппинг портов)
  - `frontend` (опционально, nginx + static build)
- [ ] Сетевое взаимодействие: bridge-сеть `app-network`
- [ ] Тома: `pgdata`, `./data`, `./logs`, `./backups`, `./models`
- [ ] `.dockerignore` (node_modules, dist, data/, logs/)

#### Заглушки под PostgreSQL

- [ ] Переменная `STORAGE_MODE` (`json` | `postgres`):
  - `json` — используются `*JsonRepository`
  - `postgres` — используются `*PrismaRepository` (через Prisma Client)
- [ ] `StorageModule` — динамический модуль, регистрирующий нужные провайдеры по `STORAGE_MODE`
- [ ] `PrismaService` (extends PrismaClient, implements OnModuleInit) — 5 строк, подключение к БД
- [ ] `prisma/schema.prisma` — схема всех 7 сущностей (единая точка правды)
- [ ] Начальная миграция: `npx prisma migrate dev --name init`
- [ ] `prisma/seed.ts` — начальные данные через `prisma db seed`

#### Seed-скрипт

- [ ] `scripts/seed.ts`:
  - 1 admin-пользователь (login=`admin`, password=`Admin123!`, accountRole=`admin`)
  - Остальные файлы: пустые items, lastId=0

#### Резервное копирование

- [ ] `scripts/backup.sh` — бэкап JSON-файлов и/или `pg_dump` для PostgreSQL
- [ ] `npm run backup` / `npm run restore` команды в `package.json`
- [ ] Ротация: 7 ежедневных + 4 еженедельных
- [ ] Документация действий администратора при аварии

#### Тестирование

- [ ] **Unit-тесты** (`test/unit/`):
  - `query.helper.spec.ts` — фильтрация, сортировка, пагинация
  - `tasks.service.spec.ts` — переходы статусов, валидация
  - `account-role.guard.spec.ts` — проверка доступа (по enum-полю)
  - `team-role.guard.spec.ts` — проверка командных ролей (по enum-полю)
  - `project-roles.guard.spec.ts` — проверка проектных ролей
  - `risk-stub.service.spec.ts` — правила оценки рисков
  - `json-file.service.spec.ts` — атомарность, кэш
- [ ] **e2e тесты** (`test/e2e/`) — 3 сквозных бизнес-процесса:
  - Тест БП1: register → login → create team → create project → assign to project → create task → проверить audit
  - Тест БП2: login → create task → assign → change status → проверить history + audit
  - Тест БП3: login → создать проект с задачами → GET /projects/:id/risk → проверить ответ

#### Swagger-проверка

- [ ] Все endpoint-ы имеют теги
- [ ] Все DTO декорированы `@ApiProperty()` с описанием и примером
- [ ] Auth-схема (Bearer) подключена

#### Документация

- [ ] README.md — архитектура, API, инструкция запуска
- [ ] Пользовательская инструкция (регистрация, роли, основной сценарий, поиск/фильтрация)

### Результат
Проект полностью готов к демонстрации и сдаче.

### Создаваемые файлы

```
Dockerfile
docker-compose.yml
.dockerignore
scripts/seed.ts
scripts/backup.sh
prisma/schema.prisma
prisma/seed.ts
src/infrastructure/prisma/prisma.service.ts
test/unit/*.spec.ts
test/e2e/*.e2e-spec.ts
```

---

## 10. Правила валидации

| №  | Правило                                                            |
| -- | ------------------------------------------------------------------ |
| 1  | `users.login` уникален, 3–50 символов, без спецсимволов            |
| 2  | `users.password` минимум 8 символов (хранится argon2 hash)         |
| 3  | `users.accountRole` — значение из AccountRole enum (`admin`/`member`/`guest`) |
| 4  | `team_members (userId, teamId)` уникальная пара                  |
| 5  | `team_members.teamRole` — значение из TeamRole enum (`owner`/`member`/`observer`) |
| 6  | `project_members (projectId, userId)` уникальная пара              |
| 6a | `project_members.userId` — участник команды, которой принадлежит проект |
| 6b | member команды → project role = `team_lead` / `developer`     |
| 6c | observer команды → project role = `observer`                    |
| 7  | `projects.teamId` существует в `teams`                             |
| 8  | `tasks.projectId` существует в `projects`                          |
| 9  | `tasks.difficulty` в диапазоне 1–5                                 |
| 10 | `tasks.deadline` ≥ `tasks.createdAt`                               |
| 11 | `tasks.createdById` существует и имеет право создавать задачи      |
| 12 | `tasks.assigneeId` (если задан) — пользователь должен быть в project_members |
| 13 | Статусы — только из разрешённых enum-ов                            |
| 14 | Смена статуса — только допустимый переход (см. раздел 11)          |
| 15 | Все FK-ссылки проверяются на существование                         |
| 16 | Каждое значимое действие → запись в `audit_logs`                   |

---

## 11. Допустимые переходы статусов

### Задачи (TaskStatus)

```typescript
const ALLOWED_TASK_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  [TaskStatus.NEW]:         [TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED],
  [TaskStatus.IN_PROGRESS]: [TaskStatus.REVIEW, TaskStatus.CANCELLED],
  [TaskStatus.REVIEW]:      [TaskStatus.DONE, TaskStatus.IN_PROGRESS],
  [TaskStatus.DONE]:        [],
  [TaskStatus.CANCELLED]:   [TaskStatus.NEW],
};
```

---

## 12. Фильтрация, поиск, пагинация

**Общий хелпер** `applyQuery<T>(items, params, searchFields)`:

1. **Фильтры** — точные совпадения по переданным полям
2. **Поиск** — `toLowerCase().includes()` по указанным полям
3. **Сортировка** — asc по умолчанию, `-field` для desc
4. **Пагинация** — `page` (default 1), `limit` (default 20, max 100)

**Поля поиска по сущностям:**

| Сущность | Поля поиска                       |
| -------- | --------------------------------- |
| users    | `login`, `fullName`, `profession` |
| teams    | `name`, `description`             |
| projects | `name`, `description`             |
| tasks    | `name`, `description`             |

**Формат ответа:**

```json
{
  "items": [],
  "total": 42,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

---

## 13. Risk Assessment — контракт ИИ-модуля

### Архитектура замены

```
IRiskAssessmentService (interface)
        ├── RiskStubService     ← Этап 1: rule-based (текущий)
        └── RiskMlService       ← Этап 2: ML-модель (будущий)
```

Замена происходит через DI: подмена провайдера в `risk.module.ts` — контроллеры и сервисы не меняются.

### Пороги риска

| Вероятность задержки | Уровень  | Цвет   |
| -------------------- | -------- | ------ |
| `> 0.6`              | `high`   | 🔴     |
| `> 0.3`              | `medium` | 🟡     |
| `≤ 0.3`              | `low`    | 🟢     |

---

## 14. Seed-данные

Скрипт `scripts/seed.ts` при запуске создаёт:

| Файл                   | Содержимое                                                      |
| ---------------------- | --------------------------------------------------------------- |
| `users.json`           | 1 запись: admin (id=1, accountRole=`admin`, password hash)     |
| Остальные 6 файлов     | Пустые: `items=[]`, `lastId=0`                                  |

**Запуск:**

```bash
npx ts-node scripts/seed.ts
```

---

## 15. Критерий «готово»

| №  | Критерий                                                          | ✅ |
| -- | ----------------------------------------------------------------- | -- |
| 1  | Backend запускается через `docker compose up` одной командой    |    |
| 2  | БД и сервер в разных Docker-контейнерах                        |    |
| 3  | Все CRUD и 3 бизнес-процесса работают через API                   |    |
| 4  | Валидации и ролевые ограничения (2 уровня RBAC) соблюдаются       |    |
| 5  | Аудит фиксирует все ключевые операции (entityType + entityId)     |    |
| 6  | Audit_logs фиксирует oldValue / newValue при смене статуса        |    |
| 7  | Поиск, фильтрация, пагинация работают на всех list-endpoint-ах    |    |
| 8  | Risk-endpoint-ы возвращают stub-оценку с riskLevel и пояснением  |    |
| 9  | Генератор синтетических данных для ML создаёт ≥ 1000 записей   |    |
| 10 | Интерфейс сохранения/загрузки модели из файла реализован       |    |
| 11 | Seed-скрипт воссоздаёт начальное состояние                        |    |
| 12 | Swagger доступен на `/api/docs` со всеми тегами и описаниями      | ⏳ частично (Этапы 1–4) |
| 13 | Unit-тесты проходят (`npm test`)                                | ⏳ частично (62 теста, Этапы 1–4) |
| 14 | e2e-тесты 3 БП проходят (`npm run test:e2e`)                    |    |
| 15 | Резервное копирование и восстановление работают                  |    |
| 16 | Серверные логи пишутся (ошибки, HTTP-запросы, ключевые события)| ⏳ частично (LoggingInterceptor, без файлового вывода) |
| 17 | Переход на PostgreSQL потребует только новых репозиториев + STORAGE_MODE=postgres |    |
| 18 | Пользовательская инструкция в README                              |    |

---

## 16. Отклонения от плана и дополнительные заметки

> Зафиксировано на 11.03.2026 после code review Этапов 1–4.

### Текущий статус

| Этап | Статус | Примечание |
| :--: | ------ | ---------- |
|  1   | ✅ Выполнен | С отклонениями по логированию |
|  2   | ✅ Выполнен | Полностью соответствует плану |
|  3   | ✅ Выполнен | Полностью соответствует плану |
|  4   | ✅ Выполнен | С отклонениями по TeamRolesGuard и каскадному удалению |
|  5   | ❌ Не начат | |
|  6   | ❌ Не начат | |
|  7   | ❌ Не начат | |
|  8   | ❌ Не начат | |

### Отклонения

| № | Этап | Описание | Влияние |
| - | :--: | -------- | ------- |
| 1 | 1 | **Логирование:** пакеты `nest-winston` и `winston` установлены как зависимости, но не настроены. Используется встроенный NestJS Logger. Вывод в файл `logs/app.log` не реализован. | Низкое — `LoggingInterceptor` логирует все HTTP-запросы в stdout. Файловый вывод добавить на Этапе 8. |
| 2 | 4 | **TeamRolesGuard не используется:** Guard и декоратор `@TeamRoles()` созданы, но не применяются в контроллерах. Вместо этого права проверяются вручную в `TeamsService.assertOwnerOrAdmin()`. | Среднее — функционал работает, но архитектурно правильнее использовать guard. Исправить при реализации Этапа 5. |
| 3 | 4 | **Прямой доступ к JsonFileService:** каскадное удаление `project_members` при удалении участника команды реализовано через `JsonFileService` напрямую, минуя репозиторий. | Среднее — нарушает паттерн DDD. Рефакторить при создании `IProjectMemberRepository` на Этапе 5. |
| 4 | 4 | **ProjectMember модель создана досрочно:** файл `src/domain/models/project-member.model.ts` создан на Этапе 4 (планировался на Этапе 5), так как используется для типизации каскадного удаления. | Нет — модель соответствует плану, просто создана раньше. |
| 5 | 2 | **Data-файлы созданы все сразу:** все 7 JSON-файлов (`projects.json`, `project_members.json`, `tasks.json`, `audit_logs.json`) созданы на Этапе 2, хотя модули для них появятся на Этапах 5–6. | Нет — пустые файлы не мешают, упрощают работу `JsonFileService`. |

### Излишки кода (неиспользуемый код)

| Файл | Описание |
| ---- | -------- |
| `src/common/exceptions/business.exception.ts` | Класс `BusinessException` определён, но нигде не вызывается. Пригодится на следующих этапах. |
| `src/app.controller.ts` + `src/app.service.ts` + `src/app.controller.spec.ts` | Шаблонный код NestJS (`Hello World`). Не нужен проекту, но не мешает. |

### Исправления, внесённые при code review

| Файл | Было | Стало | Причина |
| ---- | ---- | ----- | ------- |
| `register.dto.ts`, `create-user.dto.ts` | `@MinLength(6)` | `@MinLength(8)` | WORKPLAN §10 правило 2: «минимум 8 символов» |
| `register.dto.ts`, `create-user.dto.ts` | Нет валидации спецсимволов | `@Matches(/^[a-zA-Z0-9_]+$/)` | WORKPLAN §10 правило 1: «без спецсимволов» |
| `auth.service.ts` | `expiresIn: ... as any` | `expiresIn: ... as StringValue` | Убран небезопасный каст |
| `json-file.service.ts` | `remove()` → `this.read()` (кэш) | `remove()` → `this.readFresh()` | Потенциальная потеря данных при конкурентной записи |
| `app.module.ts` | `ThrottlerGuard` не применён | Добавлен `APP_GUARD` → `ThrottlerGuard` | Rate limiting не работал без глобального guard |
| `.env.example` | Отсутствовал | Создан | WORKPLAN §2 требует наличия |
