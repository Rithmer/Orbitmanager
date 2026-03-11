# Отчёт по анализу, выявлению недостатков и рефакторингу проекта

> **Проект:** Сервис управления проектами и задачами  
> **Студент:** Ким Андрей, ЭФБО-10-24  
> **Дата анализа:** 11.03.2026  
> **Версия отчёта:** v1.0 (итог полного рефакторинга)

---

## Содержание

1. [Итоговая оценка проекта](#1-итоговая-оценка-проекта)
2. [Анализ документации (README + WORKPLAN)](#2-анализ-документации)
3. [Анализ кода — критические баги](#3-критические-баги)
4. [Анализ кода — архитектурные проблемы](#4-архитектурные-проблемы)
5. [Анализ кода — качество и оптимизация](#5-качество-и-оптимизация)
6. [Анализ тестов](#6-анализ-тестов)
7. [Анализ инфраструктуры (Docker / CI)](#7-инфраструктура)
8. [Полная таблица недостатков](#8-полная-таблица-недостатков)
9. [Применённые исправления (рефакторинг)](#9-применённые-исправления)
10. [Статус выполнения критериев готовности](#10-статус-критериев-готовности)
11. [Рекомендации для Этапа 8](#11-рекомендации)

---

## 1. Итоговая оценка проекта

| Область | Оценка | Комментарий |
|---------|--------|-------------|
| Архитектура | **4/5** | Clean Architecture соблюдена, DDD применён корректно. Остаётся отклонение с guards |
| Документация | **4/5** | README подробный, WORKPLAN ведётся честно. Есть устаревшие секции |
| Код / качество | **3.5/5** | Есть критические баги в модулях, неиспользуемый код, неполная обработка ошибок |
| Тестирование | **3/5** | Unit-тесты есть, e2e есть, но покрытие неполное, тест spec.ts для app устарел |
| Инфраструктура | **3.5/5** | Docker готов, Prisma реализована, но env-validation неполна, THROTTLE_LIMIT неверный |

---

## 2. Анализ документации

### 2.1 README.md — Выявленные проблемы

**Проблема 1 — Раздел «Безопасность»: устаревшая информация**
```
| Защита от перебора | Throttler: 5 попыток / минута |
```
В `app.module.ts` `THROTTLE_LIMIT` по умолчанию `5`, но в WORKPLAN уже зафиксировано исправление на `60`. README не обновлён — содержит старое некорректное значение `5`.

**Проблема 2 — Раздел «Структура проекта»: несоответствие реальности**
В README указан путь `src/infrastructure/repositories/` (единая папка), но реально файлы разделены на `json/` и `prisma/` подпапки. Структура в README устарела.

**Проблема 3 — Раздел «Критерии готовности» не перенесён в README**
Критерии готовности содержатся только в WORKPLAN (§15), но не дублируются в README для читателя. README упоминает тесты без указания текущего статуса покрытия.

**Проблема 4 — `frontend/README.md` — шаблонный файл Vite**
Файл `frontend/README.md` содержит стандартный шаблон Vite без единого слова о реальном проекте. Должен описывать фронтенд-приложение.

**Проблема 5 — Раздел API: отсутствует описание `GET /` (health-check)**
WORKPLAN фиксирует, что `AppController` переделан под health-check (`GET /` → `{ status, timestamp, uptime }`), но в README в таблице REST API этот endpoint не отражён.

### 2.2 WORKPLAN.md — Выявленные проблемы

**Проблема 6 — §15 «Критерий готово»: незакрытые чекбоксы без комментариев**
Критерии №1-2, 3, 4, 9, 10, 14, 15, 17, 18 помечены как не выполненные `[ ]` без объяснения — выполнены они или нет. Особенно №17 («Переход на PostgreSQL») — реально уже реализован через `StorageModule` и Prisma-репозитории, но чекбокс не закрыт.

**Проблема 7 — §16 «Отклонения»: отклонение #2 и #6 не решены и не задокументированы как намеренные**
Гарды `TeamRolesGuard` и `ProjectRolesGuard` созданы, но не применяются. WORKPLAN честно фиксирует это, но не помечает как "архитектурное решение" — остаётся непонятным, является ли это техническим долгом.

**Проблема 8 — WORKPLAN не фиксирует текущий счётчик тестов после Этапов 5–7**
В §15 написано «62 теста, Этапы 1–4», но тесты для сервисов 5–8 этапов уже добавлены (TasksService, RiskStubService, e2e). Реальное количество тестов не обновлено.

---

## 3. Критические баги

### Баг 1 — `app.module.ts`: `THROTTLE_LIMIT` по умолчанию = 5 (слишком мало)

**Файл:** `src/app.module.ts`

```typescript
// БЫЛО (критический баг):
limit: parseInt(process.env['THROTTLE_LIMIT'] ?? '5', 10),
// 5 запросов / 60 секунд — блокирует нормальную работу UI

// ДОЛЖНО БЫТЬ:
limit: parseInt(process.env['THROTTLE_LIMIT'] ?? '60', 10),
```

WORKPLAN зафиксировал это исправление в `env.validation.ts`, но `app.module.ts` содержит хардкод `'5'` как fallback, который НЕ зависит от env.validation.

### Баг 2 — `teams.module.ts` и `projects.module.ts`: нет провайдеров репозиториев

**Файл:** `src/modules/teams/teams.module.ts`

```typescript
// БЫЛО (баг — StorageModule @Global, но providers в module пусты):
@Module({
  imports: [AuditLogsModule],
  controllers: [TeamsController, TeamMembersController],
  providers: [TeamsService],  // ← только сервис
})

// TeamsService инжектирует: TEAM_REPOSITORY, TEAM_MEMBER_REPOSITORY,
// USER_REPOSITORY, PROJECT_REPOSITORY, PROJECT_MEMBER_REPOSITORY, TASK_REPOSITORY
// Все они приходят из @Global() StorageModule — это РАБОТАЕТ,
// но является неявной зависимостью (anti-pattern).
```

Поскольку `StorageModule` помечен `@Global()`, провайдеры доступны везде — приложение запускается. Однако это архитектурная проблема: явный список зависимостей нарушен. При отключении `@Global()` всё сломается.

**Статус:** Архитектурный риск, не критический баг при текущей конфигурации.

### Баг 3 — `test/app.e2e-spec.ts`: устаревший тест `Hello World`

**Файл:** `test/app.e2e-spec.ts`

```typescript
// БЫЛО (устаревший тест после замены AppController на health-check):
it('/ (GET)', () => {
  return request(app.getHttpServer())
    .get('/')
    .expect(200)
    .expect('Hello World!');  // ← AppController уже не возвращает 'Hello World!'
});
```

`AppController` заменён на health-check (`{ status, timestamp, uptime }`), но e2e-тест не обновлён. При запуске `npm run test:e2e` этот тест **упадёт**.

### Баг 4 — `prisma/schema.prisma`: отсутствует `url` в `datasource`

**Файл:** `prisma/schema.prisma`

```prisma
// БЫЛО (невалидная схема — нет url):
datasource db {
  provider = "postgresql"
}
// Prisma требует обязательное поле url

// ДОЛЖНО БЫТЬ:
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Без `url` команда `npx prisma migrate dev` завершится с ошибкой.

### Баг 5 — `main.ts`: файловый транспорт Winston только в production

```typescript
// ПРОБЛЕМА: если NODE_ENV != 'production', логи в файл не пишутся НИКОГДА
// Это нарушает требование WORKPLAN §1: "Вывод: stdout (dev), JSON-файл logs/app.log (prod)"
// Но README §9 говорит: файл только в prod — противоречия нет.
// Однако в development невозможно проверить работу файлового логирования без переключения env.
```

**Статус:** Соответствует README, но рекомендуется добавить `LOG_TO_FILE=true` переменную для явного управления.

---

## 4. Архитектурные проблемы

### Проблема A — Guards созданы, но не применяются (отклонение #2 и #6)

`TeamRolesGuard` и `ProjectRolesGuard` существуют как файлы, декораторы `@TeamRoles()` и `@ProjectRoles()` созданы, но ни один контроллер их не использует. Вместо этого проверки прав полностью делегированы сервисному слою (`assertOwnerOrAdmin`, `assertCanManageProject` и т.д.).

**Текущий подход — сервисные проверки:**
```typescript
// teams.service.ts
private async assertOwnerOrAdmin(userId, teamId, accountRole) { ... }
```

**Планируемый подход — Guards:**
```typescript
// teams.controller.ts
@UseGuards(JwtAuthGuard, TeamRolesGuard)
@TeamRoles(TeamRole.OWNER)
@Delete(':teamId')
remove(...) { }
```

**Влияние:** Оба подхода корректны функционально. Гарды — более декларативный и тестируемый подход. Но при сервисных проверках логика RBAC разбросана по приватным методам сервисов, что усложняет поддержку.

**Рекомендация:** Либо полностью перейти на Guards (Этап 8), либо задокументировать сервисные проверки как намеренное архитектурное решение и удалить неиспользуемые Guard-файлы.

### Проблема B — `StorageModule` @Global создаёт неявные зависимости

Помечать `StorageModule` как `@Global()` позволяет всем модулям получать репозитории без явного импорта. Это удобно, но нарушает принцип явных зависимостей NestJS. Рекомендуется либо убрать `@Global()` и добавить `StorageModule.register()` в импорты тех модулей, которым нужны репозитории, либо задокументировать это решение.

### Проблема C — `AuditService` в модуле `audit-logs` экспортируется, но не везде явно импортируется

`AuditLogsModule` экспортирует `AuditService`. Все модули (teams, projects, tasks, users, auth) импортируют `AuditLogsModule` — это корректно. Однако `RiskModule` не импортирует `AuditLogsModule`, хотя `RiskStubService` использует `AUDIT_LOG_REPOSITORY` напрямую (не через `AuditService`). Это разрыв в архитектуре.

### Проблема D — `AppController`/`AppService` не удалены после замены на health-check

В WORKPLAN зафиксировано, что `app.controller.ts` и `app.service.ts` заменены на health-check. Но оба файла всё ещё существуют (шаблонные или реальные — неизвестно, т.к. в project knowledge видны оба варианта упоминания). Нужна проверка и очистка.

---

## 5. Качество и оптимизация

### Q1 — `app.module.ts`: Throttle TTL в миллисекундах, но документация говорит о секундах

```typescript
// В app.module.ts:
ttl: parseInt(process.env['THROTTLE_TTL'] ?? '60000', 10),  // миллисекунды

// В README:
// "Throttler: 5 попыток / минута" — неясно, в секундах или мс задаётся TTL
```

`@nestjs/throttler` v5+ принимает `ttl` в **миллисекундах**. `60000` мс = 60 секунд — корректно. Но `.env.example` должен явно документировать единицу измерения.

### Q2 — Неполная валидация `env.validation.ts`

```typescript
// Отсутствует валидация критичных переменных:
// DATABASE_URL — нужна при STORAGE_MODE=postgres
// LOG_LEVEL — должна быть enum ('error'|'warn'|'info'|'debug')
// CORS_ORIGIN — добавлена, но без строгого формата URL
```

### Q3 — `LoggingInterceptor`: не логирует ошибки (статусы 4xx/5xx)

```typescript
// logging.interceptor.ts — tap() срабатывает только при успехе
return next.handle().pipe(
  tap(() => {
    // Это НЕ вызывается при выброшенном исключении!
    const response = ctx.getResponse<Response>();
    this.logger.log(`${method} ${url} ${response.statusCode}`);
  }),
);

// ИСПРАВЛЕНИЕ — добавить catchError:
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

return next.handle().pipe(
  tap(() => { /* success */ }),
  catchError((err) => {
    const status = err.status ?? 500;
    this.logger.error(`${method} ${url} ${status} — ${Date.now() - startTime}ms`);
    return throwError(() => err);
  }),
);
```

### Q4 — `audit.service.ts`: `findAll` загружает все записи в память

```typescript
// audit.service.ts — для больших объёмов audit_logs это проблема
let logs = await this.auditLogRepository.findAll();  // ← ВСЕ записи
// Затем фильтрация в памяти...
```

При JSON-хранилище это неизбежно. Но когда переключится на PostgreSQL, `AuditLogsPrismaRepository.findAll()` тоже вернёт все строки без пагинации. Это потенциальная утечка памяти при большом объёме.

**Рекомендация:** Добавить `findWithFilters(filters, pagination)` в `IAuditLogRepository` для PostgreSQL-режима.

### Q5 — `projects.service.ts`: N+1 запросов в `getVisibleProjects`

```typescript
// projects.service.ts
for (const tm of teamMemberships) {
  const teamProjects = await this.projectRepository.findByTeam(tm.teamId);
  // N запросов по одному для каждой команды пользователя
}
```

При JSON это терпимо (всё в памяти). При PostgreSQL — классический N+1. Нужен `findByTeams(teamIds: number[])` метод в репозитории.

### Q6 — `tasks.service.ts`: аналогичный N+1 в `getVisibleTasks`

Аналогично Q5 — вложенные циклы с `await` для каждой команды и проекта.

### Q7 — `business.exception.ts` определён, но нигде не используется

```typescript
// common/exceptions/business.exception.ts — определён, но не вызывается
export class BusinessException extends HttpException { ... }

// Везде используются стандартные NestJS исключения:
throw new NotFoundException('Задача не найдена');
throw new ForbiddenException('Нет доступа');
```

Либо начать использовать `BusinessException` для бизнес-ошибок, либо удалить файл.

### Q8 — `teams.service.spec.ts` содержит неиспользуемый мок `mockJsonFileService`

```typescript
const mockJsonFileService = {
  read: jest.fn()...,
  remove: jest.fn()...,
};
// Этот мок нигде не используется в тестах — остаток от старого кода
```

### Q9 — Prisma-репозитории: `update` делает двойной `findUnique` (exists check)

```typescript
// teams.prisma.repository.ts, projects.prisma.repository.ts, etc.
async update(id: number, partial: Partial<Team>): Promise<Team | null> {
  const exists = await this.prisma.team.findUnique({ where: { id } });
  if (!exists) return null;
  // Затем ещё один запрос:
  const row = await this.prisma.team.update({ where: { id }, data });
  return this.toDomain(row);
}

// ОПТИМИЗАЦИЯ — убрать лишний findUnique:
async update(id: number, partial: Partial<Team>): Promise<Team | null> {
  try {
    const row = await this.prisma.team.update({ where: { id }, data: { ...partial } });
    return this.toDomain(row);
  } catch (e) {
    if (e.code === 'P2025') return null;  // Record not found
    throw e;
  }
}
```

### Q10 — `main.ts`: LoggingInterceptor создаётся без DI (нет доступа к Winston)

```typescript
// main.ts
app.useGlobalInterceptors(new LoggingInterceptor());
// LoggingInterceptor использует new Logger('HTTP') — это встроенный NestJS Logger,
// НЕ Winston. Логи HTTP-запросов идут не в Winston-транспорт.

// ПРАВИЛЬНО — регистрировать через APP_INTERCEPTOR в app.module.ts:
// providers: [{ provide: APP_INTERCEPTOR, useClass: LoggingInterceptor }]
```

---

## 6. Анализ тестов

### T1 — `test/app.e2e-spec.ts`: тест упадёт (Баг 3, см. выше)

Тест проверяет `'Hello World!'`, но `AppController` возвращает объект `{ status, timestamp, uptime }`.

### T2 — Unit-тесты не покрывают ProjectsService и AuditLogsController

Из project knowledge видны тесты для: `UsersService`, `TeamsService`, `TasksService`, `RiskStubService`, `AuthService` (предположительно), `JsonFileService`, `TeamRolesGuard`. **Отсутствуют тесты** для:
- `ProjectsService` (самый сложный сервис с visibility-логикой)
- `AuditService` (фильтрация, валидация)
- `ProjectRolesGuard`
- `AccountRolesGuard`

### T3 — e2e тест: жёсткая привязка к JSON-файлам (не работает в postgres-режиме)

```typescript
// business-processes.e2e-spec.ts
function backupData(): void {
  // Напрямую копирует data/*.json файлы
  fs.copyFileSync(src, path.join(BACKUP_DIR, f));
}
```

E2E тесты работают только при `STORAGE_MODE=json`. При `postgres` — упадут на `backupData()`.

### T4 — `teams.service.spec.ts`: `mockJsonFileService` не провайдится в тестовом модуле

```typescript
// teams.service.spec.ts — мок объявлен, но не добавлен в providers:
const mockJsonFileService = { ... };
// В providers: нет `{ provide: JsonFileService, useValue: mockJsonFileService }`
```

Это мёртвый код — остаток рефакторинга.

---

## 7. Инфраструктура

### I1 — `prisma/schema.prisma`: отсутствует `url` (Баг 4, критический)

Без `url = env("DATABASE_URL")` Prisma не сможет выполнить ни одну команду.

### I2 — `docker-compose.yml`: нет healthcheck для backend-контейнера

```yaml
# Рекомендуется добавить:
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/"]
  interval: 30s
  timeout: 10s
  retries: 3
```

### I3 — `.env.example`: единицы измерения `THROTTLE_TTL` не документированы

```bash
# .env.example
THROTTLE_TTL=60000    # миллисекунды или секунды?
THROTTLE_LIMIT=60     # запросов за TTL период
```

Нужен комментарий: `# миллисекунды (60000 = 60 сек)`.

### I4 — `Dockerfile` (backend): не скопированы `data/` файлы

```dockerfile
# При запуске в Docker data/*.json файлов нет,
# JsonFileService создаст их при первом обращении — это корректно.
# Но seed-скрипт должен запускаться ПОСЛЕ старта контейнера.
# docker-compose.yml должен содержать entrypoint или healthcheck для seed.
```

---

## 8. Полная таблица недостатков

| № | Категория | Файл | Критичность | Описание | Статус |
|---|-----------|------|-------------|----------|--------|
| 1 | Документация | `README.md` | Низкая | Throttle указан как «5 попыток/мин» — устарело | Нужно исправить |
| 2 | Документация | `README.md` | Низкая | Структура `infrastructure/repositories/` не отражает `json/`+`prisma/` | Нужно исправить |
| 3 | Документация | `README.md` | Низкая | Отсутствует `GET /` (health-check) в таблице API | Нужно добавить |
| 4 | Документация | `frontend/README.md` | Средняя | Шаблонный Vite README, не описывает проект | Нужно заменить |
| 5 | Документация | `WORKPLAN.md` | Средняя | §15: критерий №17 выполнен, но чекбокс не закрыт | Нужно закрыть |
| 6 | Документация | `WORKPLAN.md` | Низкая | Счётчик тестов «62 теста» устарел | Нужно обновить |
| 7 | **Критический баг** | `app.module.ts` | **Высокая** | `THROTTLE_LIMIT ?? '5'` — блокирует нормальную работу | **Исправлено** |
| 8 | **Критический баг** | `test/app.e2e-spec.ts` | **Высокая** | Тест `Hello World` упадёт при запуске | **Исправлено** |
| 9 | **Критический баг** | `prisma/schema.prisma` | **Высокая** | Отсутствует `url = env("DATABASE_URL")` | **Исправлено** |
| 10 | Архитектура | `teams.module.ts` | Средняя | Неявная зависимость от `@Global()` StorageModule | Задокументировано |
| 11 | Архитектура | `projects.module.ts` | Средняя | То же — неявная зависимость | Задокументировано |
| 12 | Архитектура | Гарды | Средняя | `TeamRolesGuard`, `ProjectRolesGuard` не применяются | Техдолг |
| 13 | Архитектура | `main.ts` | Средняя | `LoggingInterceptor` вне DI — не использует Winston | **Исправлено** |
| 14 | Качество | `logging.interceptor.ts` | Средняя | Ошибки 4xx/5xx не логируются в интерсепторе | **Исправлено** |
| 15 | Качество | `business.exception.ts` | Низкая | Определён, но нигде не используется | Задокументировано |
| 16 | Качество | `teams.service.spec.ts` | Низкая | `mockJsonFileService` — мёртвый код | **Исправлено** |
| 17 | Качество | Prisma репозитории | Низкая | Двойной `findUnique` в `update()` — лишний запрос | **Исправлено** |
| 18 | Оптимизация | `projects.service.ts` | Средняя | N+1 в `getVisibleProjects` при PostgreSQL | Задокументировано |
| 19 | Оптимизация | `tasks.service.ts` | Средняя | N+1 в `getVisibleTasks` при PostgreSQL | Задокументировано |
| 20 | Оптимизация | `audit.service.ts` | Средняя | `findAll()` без DB-уровня фильтрации | Задокументировано |
| 21 | Инфраструктура | `prisma/schema.prisma` | Критичная | `url` отсутствует в datasource | **Исправлено** |
| 22 | Инфраструктура | `.env.example` | Низкая | Единицы `THROTTLE_TTL` не документированы | **Исправлено** |
| 23 | Тесты | `test/app.e2e-spec.ts` | Высокая | Устаревший тест `Hello World` | **Исправлено** |
| 24 | Тесты | Unit-тесты | Средняя | Нет тестов для `ProjectsService`, `AuditService` | Техдолг (Этап 8) |
| 25 | Тесты | e2e | Средняя | Тесты работают только с `STORAGE_MODE=json` | Задокументировано |
| 26 | Качество | `app.module.ts` | Низкая | `THROTTLE_TTL` default=60000 без комментария единицы | **Исправлено** |

---

## 9. Применённые исправления (рефакторинг)

### 9.1 `src/app.module.ts` — исправление THROTTLE_LIMIT

```typescript
// БЫЛО:
limit: parseInt(process.env['THROTTLE_LIMIT'] ?? '5', 10),

// СТАЛО:
limit: parseInt(process.env['THROTTLE_LIMIT'] ?? '60', 10),
```

### 9.2 `src/main.ts` — перенос LoggingInterceptor в DI

```typescript
// БЫЛО (вне DI, не использует Winston):
app.useGlobalInterceptors(new LoggingInterceptor());

// СТАЛО — удалено из main.ts, добавлено в app.module.ts:
// providers: [{ provide: APP_INTERCEPTOR, useClass: LoggingInterceptor }]
```

### 9.3 `src/common/interceptors/logging.interceptor.ts` — логирование ошибок

```typescript
// Добавлен catchError для логирования 4xx/5xx:
return next.handle().pipe(
  tap(() => {
    const response = ctx.getResponse<Response>();
    const duration = Date.now() - startTime;
    this.logger.log(`${method} ${url} ${response.statusCode} — ${duration}ms`);
  }),
  catchError((err: unknown) => {
    const status = (err as { status?: number }).status ?? 500;
    const duration = Date.now() - startTime;
    this.logger.error(`${method} ${url} ${status} — ${duration}ms`);
    return throwError(() => err);
  }),
);
```

### 9.4 `prisma/schema.prisma` — добавлен url

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 9.5 `test/app.e2e-spec.ts` — обновлён тест health-check

```typescript
// БЫЛО:
.expect('Hello World!')

// СТАЛО:
.expect((res) => {
  expect(res.body).toHaveProperty('status', 'ok');
  expect(res.body).toHaveProperty('uptime');
});
```

### 9.6 `src/infrastructure/repositories/prisma/*.prisma.repository.ts` — оптимизация update()

Для всех 5 Prisma-репозиториев (teams, projects, project-members, tasks, users) убран двойной `findUnique` в `update()`:

```typescript
// БЫЛО:
const exists = await this.prisma.team.findUnique({ where: { id } });
if (!exists) return null;
const row = await this.prisma.team.update({ where: { id }, data });

// СТАЛО:
try {
  const row = await this.prisma.team.update({ where: { id }, data });
  return this.toDomain(row);
} catch (e: unknown) {
  const prismaError = e as { code?: string };
  if (prismaError.code === 'P2025') return null;
  throw e;
}
```

### 9.7 `src/modules/teams/teams.service.spec.ts` — удалён мёртвый мок

```typescript
// УДАЛЕНО:
const mockJsonFileService = {
  read: jest.fn().mockResolvedValue(...),
  remove: jest.fn().mockResolvedValue(true),
};
```

### 9.8 `.env.example` — добавлены комментарии и исправлен THROTTLE_LIMIT

```bash
# Throttler (Rate limiting)
THROTTLE_TTL=60000     # Окно в миллисекундах (60000 = 60 секунд)
THROTTLE_LIMIT=60      # Максимум запросов за THROTTLE_TTL
```

### 9.9 `README.md` — исправления документации

- Обновлена таблица «Безопасность»: `60 запросов / минута` вместо `5 попыток / минута`
- Обновлена структура `infrastructure/repositories/json/` и `prisma/`
- Добавлен endpoint `GET /` в таблицу API (health-check)
- Обновлён раздел тестирования с актуальным статусом

### 9.10 `WORKPLAN.md` — закрыт критерий №17

```markdown
| 17 | Переход на PostgreSQL потребует только STORAGE_MODE=postgres | ✅ |
```

Prisma-репозитории и `StorageModule` полностью реализованы.

---

## 10. Статус критериев готовности

| № | Критерий | Статус | Примечание |
|---|----------|--------|------------|
| 1 | Backend запускается через `docker compose up` | ⏳ | Требуется проверка после исправления schema.prisma |
| 2 | БД и сервер в разных контейнерах | ✅ | docker-compose.yml реализован |
| 3 | Все CRUD и 3 бизнес-процесса | ✅ | API полностью реализован |
| 4 | Валидации и RBAC | ✅ | Работает через сервисные проверки |
| 5 | Аудит ключевых операций | ✅ | AuditService встроен во все модули |
| 6 | oldValue/newValue при смене статуса | ✅ | TasksService реализует БП2 |
| 7 | Поиск, фильтрация, пагинация | ✅ | QueryHelper реализован |
| 8 | Risk-endpoint-ы | ✅ | RiskStubService реализован |
| 9 | Генератор синтетических данных ≥1000 | ⏳ | Этап 8 |
| 10 | Загрузка/сохранение ML-модели | ⏳ | Этап 8 |
| 11 | Seed-скрипт | ✅ | scripts/seed.ts реализован |
| 12 | Swagger на `/api/docs` | ✅ | Частично (тег-аннотации нужна проверка) |
| 13 | Unit-тесты | ⏳ | Есть, но неполное покрытие |
| 14 | e2e-тесты 3 БП | ✅ | business-processes.e2e-spec.ts реализован |
| 15 | Резервное копирование | ✅ | scripts/backup.sh реализован |
| 16 | Серверные логи | ✅ | Winston + LoggingInterceptor |
| 17 | Переход на PostgreSQL | ✅ | StorageModule + Prisma полностью реализованы |
| 18 | Пользовательская инструкция | ✅ | README §14 реализован |

---

## 11. Рекомендации для Этапа 8

### Приоритет 1 — Обязательные (для «Критерия готово»)

1. **Дописать unit-тесты** для `ProjectsService` и `AuditService` — критерий №13
2. **Генератор синтетических данных** `scripts/generate-training-data.ts` — критерий №9
3. **Интерфейс ML-модели** (save/load `risk-model.joblib`) — критерий №10
4. **Проверить Swagger**: все DTO должны иметь `@ApiProperty()`, все контроллеры — теги
5. **Запустить миграцию Prisma**: `npx prisma migrate dev --name init`

### Приоритет 2 — Рекомендуемые

6. **Применить Guards в контроллерах** (устранить отклонения #2 и #6) — улучшит архитектуру
7. **Добавить `findByTeams(teamIds[])` в репозиторий** — устранит N+1 при PostgreSQL
8. **Добавить `findWithFilters()` в IAuditLogRepository** — устранит полную загрузку в память
9. **Добавить healthcheck в docker-compose** для backend-контейнера
10. **Обновить `frontend/README.md`** — описать React SPA, переменные окружения, запуск

### Приоритет 3 — Технический долг

11. **Решить судьбу `BusinessException`** — использовать или удалить
12. **Убрать `@Global()` с StorageModule** и добавить явные импорты в модули
13. **Вынести `LoggingInterceptor` из `main.ts` в `app.module.ts`** (уже исправлено в рефакторинге)
14. **Покрыть e2e тесты PostgreSQL-режимом** — хотя бы smoke-тест

---

*Документ подготовлен автоматически по результатам полного code review проекта.*  
*Версия: v1.0, дата: 11.03.2026*
