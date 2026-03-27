# Архитектурный аудит проекта

> **Стек:** NestJS + React + Prisma + Python ML-сервис
> **Дата:** 2026-03-28
> **Общая оценка: 7.5 / 10**

---

## 1. Executive Summary

Проект — система управления проектами (task/project management) на стеке NestJS + React + Prisma + Python ML-сервис. Архитектура чистая, слоистая, с грамотным разделением ответственности. Backend демонстрирует высокий уровень инженерной дисциплины: repository pattern, strategy pattern, CQRS-light для read-моделей, три уровня ролевой модели. Frontend функционален, но страдает от раздутых page-компонентов и дублирования.

**Лучше всего соблюдены:** SOLID (особенно SRP на backend, DIP через repository interfaces), Бритва Оккама (на backend).

**Самые серьёзные проблемы:** DRY (дублирование enum/types между backend и frontend, дублирование access-хуков, дублирование кэш-сервисов), KISS (раздутые page-компоненты на frontend до 1084 строк), SRP (god-pages на frontend, god-services на backend до 638 строк).

---

## 2. Карта проекта

### 2.1 Основные подсистемы

| Подсистема | Путь | Назначение |
|---|---|---|
| Backend (NestJS) | `backend/src/` | API, бизнес-логика, авторизация |
| Frontend (React) | `frontend/src/` | SPA, UI, клиентская логика |
| ML Service (Python) | `ml-service/` | Оценка рисков через ML-модель |
| Prisma / DB | `backend/prisma/` | Схема, миграции, seed-данные |
| Infrastructure | `docker-compose.yml`, `Dockerfile*` | Оркестрация, сборка |
| CI/CD | `.github/workflows/ci.yml` | Автоматизация сборки и тестов |

### 2.2 Ключевые entry points

- **Backend:** `backend/src/main.ts` -> `backend/src/app.module.ts`
- **Frontend:** `frontend/src/main.tsx` -> `frontend/src/App.tsx` -> `frontend/src/app/routes.ts`
- **ML:** `ml-service/app/main.py`

### 2.3 Самые рискованные зоны

1. **Frontend pages** — `Projects.tsx` (1084 строки), `Admin.tsx` (952), `Calendar.tsx` (784), `Teams.tsx` (729)
2. **Backend god-services** — `teams.service.ts` (638), `projects.service.ts` (590), `tasks.service.ts` (468)
3. **Дублирование типов** — enums и interfaces определены дважды: `backend/src/common/enums/` и `frontend/src/app/types/index.ts`

---

## 3. Анализ по принципам

### 3.1 KISS — Keep It Simple, Stupid

#### Положительные примеры

| Где | Что | Почему это хорошо |
|---|---|---|
| Все backend controllers (31-172 строки) | Чистая делегация в сервисы, нулевая бизнес-логика | Presentation layer максимально тонкий |
| `backend/src/app.controller.ts` (34 строки) | Health checks: generic, liveness, readiness с проверкой БД | Минимально, достаточно, Kubernetes-ready |
| `backend/src/common/read-models/read-model-response.factory.ts` (98 строк) | Утилита для трансформации данных в read-model формат | Небольшая, переиспользуемая, без лишних абстракций |

#### Нарушения

| Где | Что происходит | Почему это нарушает KISS | Severity | Confidence |
|---|---|---|---|---|
| `frontend/src/app/pages/Projects.tsx` — **1084 строки** | CRUD проектов + управление участниками + модалки + формы + пагинация + поиск в одном файле | Невозможно быстро понять, что делает компонент; огромная когнитивная нагрузка | **High** | High |
| `frontend/src/app/pages/Admin.tsx` — **952 строки** | UsersPanel + AuditPanel + MlModelPanel в одном файле | Три независимых панели в одном компоненте | **High** | High |
| `frontend/src/app/pages/Calendar.tsx` — **784 строки** | Календарный грид + события + фильтры + формы создания/редактирования | Сложность непропорциональна задаче одного view | **High** | High |
| `frontend/src/app/pages/Teams.tsx` — **729 строк** | Список + создание + редактирование + управление участниками | Все CRUD-операции в одном компоненте | **High** | High |
| `backend/src/common/cache/` — два почти идентичных кэш-сервиса | `InMemoryCacheService` (67 строк) и `TtlCacheService` (72 строки) — оба реализуют get/set/getOrSet/invalidateByPrefix | Разница только в фоновом eviction; два сервиса для одной задачи — усложнение | **Medium** | High |

#### Спорные места

| Где | Что | Вердикт | Confidence |
|---|---|---|---|
| View-модули (`projects-list-view`, `teams-list-view`, `calendar-view`, `project-board`) как отдельные NestJS modules | CQRS-light подход: отдельные модули для read-path | Увеличивает количество модулей, но явно разделяет чтение и запись. Оправдано, если read-path оптимизируется отдельно | Medium |
| Risk module — 7 сервисов для одного домена | `RiskStubService`, `RiskMlService`, `MlClientService`, `RiskPageReadModelService`, `RiskPageProjectionService`, `RiskAssigneeScoringService`, контроллер | Каждый сервис сфокусирован, но навигация по 7 файлам требует усилий. Скорее оправдано | Medium |

---

### 3.2 DRY — Don't Repeat Yourself

#### Положительные примеры

| Где | Что | Почему это хорошо |
|---|---|---|
| `backend/src/infrastructure/repositories/prisma/prisma-query.utils.ts` (64 строки) | `normalizePage()`, `normalizeLimit()`, `getPagination()`, `buildOrderBy()`, `buildStringSearch()` | Единый source of truth, переиспользуется всеми Prisma-репозиториями |
| `backend/src/common/validators/strong-password.ts` | Единый валидатор паролей | Используется в RegisterDto, ChangePasswordDto, CreateUserDto — одно место для изменений |
| `frontend/src/app/query/query-keys.ts` | Централизованная фабрика ключей для TanStack Query | Устраняет magic-строки, упрощает инвалидацию |

#### Нарушения

**1. Enum и type дублирование между backend и frontend**

| Severity: **High** | Confidence: **High** |
|---|---|

Backend определяет enums в `backend/src/common/enums/`: `AccountRole`, `TeamRole`, `ProjectRole`, `TaskStatus`, `ProjectStatus`, `RiskLevel`, `AuditAction`, `ALLOWED_TASK_TRANSITIONS`.

Frontend **полностью дублирует** все эти enums в `frontend/src/app/types/index.ts` (строки 1-56).

Аналогично дублированы интерфейсы `TaskRiskOutput` и `ProjectRiskOutput`:
- Backend: `backend/src/domain/services/risk-assessment.interface.ts`
- Frontend: `frontend/src/app/types/index.ts` (строки 138-151)

**Тип дублирования:** Структурное, с риском рассинхронизации. При изменении enum на backend frontend может продолжать использовать устаревшие значения. Нет механизма автогенерации типов.

---

**2. Три access-хука на frontend — 90% копипаста**

| Severity: **Medium** | Confidence: **High** |
|---|---|

Файлы:
- `frontend/src/app/hooks/useAnalyticsSectionAccess.ts` (48 строк)
- `frontend/src/app/hooks/useProjectsSectionAccess.ts` (44 строки)
- `frontend/src/app/hooks/useRisksSectionAccess.ts` (42 строки)

Все три: вызывают `useNavMembershipBatch()`, проверяют `isAdmin`, ищут `isTeamOwner`, затем отличаются **только финальным условием** на project role. Различие — буквально 2 строки в каждом. Остальные ~40 строк — идентичны.

Любое изменение в логике доступа придётся повторять в трёх файлах.

---

**3. Pagination helpers дублируются в сервисах**

| Severity: **Medium** | Confidence: **High** |
|---|---|

Функции `normalizePage()`, `normalizeLimit()`, `toPaginatedResult()`, `applyInMemoryPagination()` повторяются в `UsersService`, `TeamsService`, `AuditService` и других, хотя аналогичные утилиты уже есть в:
- `backend/src/infrastructure/repositories/prisma/prisma-query.utils.ts`
- `backend/src/common/query/pagination.ts`

---

**4. Дублирование findPage/findPaginated в AuditLogsPrismaRepository**

| Severity: **Low** | Confidence: **High** |
|---|---|

Два метода с идентичной логикой в `backend/src/infrastructure/repositories/prisma/audit-logs.prisma.repository.ts`.

#### Допустимое дублирование

Feature-level types (`board/types.ts`, `calendar/types.ts` и т.д.) — каждый feature-модуль определяет свои view-model types. Это не прямое дублирование базовых типов, а специфические read-модели с конкретных endpoint'ов. **Допустимо.**

---

### 3.3 YAGNI — You Aren't Gonna Need It

#### Положительные примеры

| Где | Что |
|---|---|
| Backend в целом | Нет overbuilt abstractions: нет абстрактных базовых контроллеров, generic CRUD frameworks, event bus без потребителей. Каждый модуль решает конкретную задачу |

#### Нарушения

| Где | Что выглядит преждевременным | Почему это YAGNI-риск | Severity | Confidence |
|---|---|---|---|---|
| `frontend/src/app/types/index.ts:107-124` | `Task` interface содержит одновременно `assigneeIds`/`assignees` (новый контракт) и `assigneeId`/`assignee` (legacy, помечен комментарием "old contract") | Если миграция завершена, legacy-поля — мёртвый код | **Low** | Medium |
| `backend/src/domain/services/risk-assessment.interface.ts:37` | `loadModel?(): Promise<void>` — optional метод в `IRiskAssessmentService` | Только одна реализация его использует; optional method в interface — extension point без доказанной необходимости | **Low** | Medium |
| `backend/src/common/cache/ttl-cache.service.ts` | Фоновый eviction каждые 60 секунд | При масштабе проекта lazy eviction в `InMemoryCacheService` достаточен; proactive eviction не подтверждён замерами | **Low** | Medium |

---

### 3.4 BDUF — Big Design Up Front

#### Положительные примеры

| Где | Что |
|---|---|
| Backend module structure | 14 feature-модулей для системы с пользователями, командами, проектами, задачами, календарём, рисками, дашбордом, отчётами, аудитом — обоснованный масштаб. Это не enterprise-bloat для TODO-приложения |

#### Нарушения

| Где | Что | Что даёт | Что делает подозрительным | Severity | Confidence |
|---|---|---|---|---|---|
| `backend/src/common/guards/` — три guard'а | Трёхуровневая ролевая модель (Account -> Team -> Project) | Гибкий RBAC с каскадными проверками | Три уровня ролей создают combinatorial explosion access-сценариев; не все комбинации могут реально использоваться | **Low** | Low |
| `backend/src/domain/` + `backend/src/infrastructure/repositories/prisma/` | Полная чистая архитектура с разделением domain interfaces и infrastructure implementations | Тестируемость через мок-репозитории | Prisma уже генерирует типы; domain models — anemic interfaces без логики; repository pattern добавляет ~100-200 строк boilerplate на сущность; маловероятна смена ORM | **Medium** | Medium |

---

### 3.5 SOLID

#### S — Single Responsibility Principle

**Положительные примеры:**

| Где | Что |
|---|---|
| Все backend контроллеры (30-172 строки) | Чисто presentation layer: маршрутизация и делегация |
| `backend/src/common/access/project-access.service.ts` | Выделенный сервис для логики доступа к проектам (вместо размазанной по guards логики) |
| Декораторы (`@Public`, `@Roles`, `@CurrentUser`) | Одна ответственность каждый |
| `backend/src/common/filters/global-exception.filter.ts` | Централизованная обработка ошибок |

**Нарушения:**

| Где | Размер | Что нарушено | Severity | Confidence |
|---|---|---|---|---|
| `backend/src/modules/teams/teams.service.ts` | 638 строк | Управление командами + управление участниками + каскадное удаление проектов/задач + аудит-логирование + кэш-инвалидация. Минимум 3 причины для изменения | **High** | High |
| `backend/src/modules/projects/projects.service.ts` | 590 строк | CRUD проектов + управление участниками + проверка доступа + каскадные операции | **High** | High |
| `frontend/src/app/pages/Projects.tsx` | 1084 строки | Роутинг + список проектов + формы + модалки + участники + пагинация + поиск + доступ | **High** | High |
| `frontend/src/app/pages/Admin.tsx` | 952 строки | Три независимых панели (Users, Audit, ML Model) в одном файле | **Medium** | High |

#### O — Open/Closed Principle

**Положительные примеры:**

| Где | Что |
|---|---|
| `backend/src/modules/risk/risk.module.ts` (строки 24-38) | Strategy pattern: добавление нового провайдера рисков (например, GPT-based) не требует изменения существующих сервисов. Достаточно добавить новый класс, реализующий `IRiskAssessmentService` |
| Guard system | Добавление нового уровня ролей потребует новый guard, но не изменение существующих |
| NestJS module system | Добавление нового feature module не затрагивает существующие |

Значимых нарушений OCP не обнаружено.

#### L — Liskov Substitution Principle

**Положительные примеры:**

| Где | Что |
|---|---|
| `RiskStubService` / `RiskMlService` | Обе реализуют `IRiskAssessmentService` и взаимозаменяемы через factory. Потребители не знают, какая реализация используется |
| Repository interfaces -> Prisma implementations | Подстановка работает корректно |

**Спорное:**

| Где | Что | Severity | Confidence |
|---|---|---|---|
| `IRiskAssessmentService.loadModel?()` | Optional метод — клиенту нужно проверять наличие. TypeScript optional member, а не ложная реализация | **Low** | Medium |

#### I — Interface Segregation Principle

**Положительные примеры:**

| Где | Что |
|---|---|
| Repository interfaces | Содержат только необходимые методы для каждой сущности. Нет единого `IGenericRepository<T>` с 20 методами |
| `IRiskAssessmentService` | 3 обязательных метода + 1 optional. Минимальный контракт |

**Нарушения:**

| Где | Что | Severity | Confidence |
|---|---|---|---|
| `frontend/src/app/types/index.ts` (Task interface) | 14 полей, включая legacy `assigneeId`/`assignee` и новые `assigneeIds`/`assignees`. Клиенты вынуждены работать с раздутым интерфейсом | **Low** | Medium |

#### D — Dependency Inversion Principle

**Положительные примеры:**

| Где | Что |
|---|---|
| Symbol-based DI tokens | `USER_REPOSITORY = Symbol(...)` — сервисы зависят от абстракций (interfaces), не от Prisma-реализаций |
| `RISK_ASSESSMENT_SERVICE` | Контроллер инжектирует интерфейс, а не конкретный stub/ml сервис |
| NestJS DI container | Используется повсеместно — нет прямого `new` для сервисов |

**Нарушения:**

| Где | Что | Severity | Confidence |
|---|---|---|---|
| `DashboardService`, `ReportsService` и другие read-model сервисы | Используют `PrismaService` напрямую (мимо repository abstraction). Осознанное решение (CQRS-light), но создаёт tight coupling к Prisma в application layer | **Low** | High |

---

### 3.6 APO — Avoid Premature Optimization

#### Положительные примеры

| Где | Оптимизация | Почему оправдана |
|---|---|---|
| `backend/src/common/access/project-access.service.ts` | Кэш `getVisibleProjectIds()` с TTL 60s | Метод вызывается на каждый запрос в guards — частый hot path |
| `AuthenticatedRequest.projectAccessCache` | Request-scoped cache в guards | Избегает повторных запросов к БД в рамках одного HTTP-запроса. Минимальный overhead |

#### Нарушения

| Где | Оптимизация | Почему может быть преждевременной | Оправдана ли | Severity | Confidence |
|---|---|---|---|---|---|
| `backend/src/infrastructure/prisma/prisma.service.ts` | Ручное управление connection pool (pg.Pool, min:2, max:10) | Prisma уже имеет встроенный connection pool. PrismaPg adapter с нативным pg.Pool — оптимизация для масштаба, который может не наступить | Для production — да; для учебного проекта — перебор | **Low** | Medium |
| `backend/src/modules/users/users.service.ts` | Profile update rate limiting (5 updates / 5 min) через in-memory cache | Нестандартное решение; защита от нетипичной проблемы; стандартный throttler мог бы справиться | Частично оправдана | **Low** | Medium |

---

### 3.7 Бритва Оккама

#### Положительные примеры

| Где | Что |
|---|---|
| Декораторы `@Public()`, `@Roles()` и т.д. (6-12 строк каждый) | Решают задачу без лишних сущностей |
| `backend/src/common/enums/task-status.enum.ts` | State machine реализована простым `Record<TaskStatus, TaskStatus[]>`, а не отдельным StateMachine классом |

#### Нарушения

| Где | Что | Какой слой лишний | Severity | Confidence |
|---|---|---|---|---|
| `InMemoryCacheService` + `TtlCacheService` | Два механизма для кэширования с TTL | `TtlCacheService` — это `InMemoryCacheService` + `setInterval`. Одного сервиса с опциональным proactive eviction было бы достаточно | **Medium** | High |
| `frontend/src/app/api/risk.ts` + `frontend/src/app/api/risks.ts` | Два API-файла для одного домена | Разделение неочевидно из названий | **Low** | High |
| 4 view-модуля как отдельные NestJS modules | `projects-list-view`, `teams-list-view`, `calendar-view`, `project-board` — каждый имеет module + controller + service + types | Для read-only эндпоинтов могли бы быть дополнительными сервисами в основных модулях. 4 модуля x 4-5 файлов = ~20 файлов вместо ~8 | **Low** | Medium |

---

## 4. NestJS-специфичный аудит

### Modules

14 feature-модулей + 5 common/infrastructure модулей. Для PM-системы — адекватный масштаб. CQRS-view модули (4 шт.) добавляют overhead, но дают чистое разделение read/write path.

### Controllers

**Образцовые.** 31-172 строки. Нулевая бизнес-логика. Чистая делегация. Swagger-документация. Корректные HTTP-коды (201 для create, 204 для logout).

### Services

**Проблемная зона.** Основные сервисы перегружены:

| Сервис | Строк | Проблема |
|---|---|---|
| `teams.service.ts` | **638** | CRUD + members + cascade delete + audit + cache — god-service |
| `projects.service.ts` | **590** | CRUD + members + access control + cascade — god-service |
| `tasks.service.ts` | **468** | На грани; включает status transitions + assignees |
| `dashboard.service.ts` | **407** | Допустимо для агрегирующего read-сервиса |
| `risk-stub.service.ts` | **364** | Допустимо — сложная rule-based логика |
| `reports.service.ts` | **312** | Допустимо |

### DTO / validation

Грамотно. `class-validator` с кастомными валидаторами (`@IsStrongPassword`). DTO не дублируют друг друга (`CreateDto` vs `UpdateDto` — `PartialType`). Barrel-exports через `index.ts`.

### Guards / interceptors / pipes

Guards хорошо спроектированы. Трёхуровневая ролевая модель (account -> team -> project). `LoggingInterceptor` — минимален и полезен. `GlobalExceptionFilter` — production-ready с разделением dev/prod поведения.

### Prisma access

Repository pattern с domain interfaces и infrastructure implementations. Паттерн `toDomain()` для маппинга Prisma -> Domain model. Хорошо, но добавляет ~100 строк boilerplate на сущность. Read-model сервисы обходят repositories и работают с Prisma напрямую (осознанный CQRS).

### Config / env

`backend/src/config/env.validation.ts` — Joi schema с conditional validation (`ML_SERVICE_URL` обязателен только при `RISK_PROVIDER=ml`). Fail-fast на старте. Чисто и надёжно.

### Auth / roles

- Argon2 для паролей (лучше bcrypt)
- Отдельные access + refresh tokens с ротацией
- Token revocation через hash в БД
- Throttling на auth endpoints (20/min vs 180/min)
- SHA256 hash для refresh tokens (не хранятся в plaintext)

**Отличное решение.**

### Где стек использован хорошо

- NestJS DI и модульная система — по назначению
- Guards + decorators — чистый composition-based authorization
- Strategy pattern для risk — образцовый
- Swagger + class-validator — хорошая типизация API

### Где стек перегружен

- Repository abstraction layer поверх Prisma — overhead для этого масштаба
- View-modules как отдельные NestJS modules — спорный overhead
- Два кэш-сервиса — лишняя сущность

---

## 5. React-специфичный аудит

### Pages / components

**Главная проблема проекта.** Размеры page-компонентов:

| Файл | Строк | Статус |
|---|---|---|
| `Projects.tsx` | **1084** | God-component |
| `Admin.tsx` | **952** | God-component |
| `Calendar.tsx` | **784** | God-component |
| `Teams.tsx` | **729** | God-component |
| `Reports.tsx` | 605 | На грани |
| `Board.tsx` | 597 | На грани |
| `Settings.tsx` | 472 | Допустимо (много форм) |
| `Risks.tsx` | 422 | Допустимо |
| `Dashboard.tsx` | 380 | Хорошо |
| `Register.tsx` | 174 | Хорошо |
| `Login.tsx` | 148 | Хорошо |

Компоненты >500 строк содержат: state management (20+ useState), form logic, API calls, modals, rendering, business rules.

### Hooks

Feature-specific hooks (`use-board-mutations.ts`, `use-dashboard-summary-query.ts`) — хорошо извлечены, по одной ответственности. Но **три access-хука** — чистая копипаста (см. раздел 3.2 DRY).

### Context / state

Два context: Auth и Theme. Минимально, достаточно. Нет лишних глобальных state'ов. TanStack Query используется как серверный state management — правильный подход.

### API layer

Хорошо организован: отдельный файл на домен. `frontend/src/app/api/client.ts` — грамотная обработка token refresh с защитой от race condition. Но: два файла для рисков (`risk.ts` и `risks.ts`) — путаница.

### Query / data flow

TanStack Query настроен корректно:
- staleTime 60s
- Retry с пропуском 4xx
- Централизованные query keys
- `keepPreviousData` на пагинированных запросах

### Forms

**Отсутствует form library.** Формы реализованы через россыпь `useState`. Нет React Hook Form или аналога. Валидация ручная. Это увеличивает объём page-компонентов и создаёт дублирование form-логики.

### Shared components

| Компонент | Строк | Назначение | Качество |
|---|---|---|---|
| `PageShell.tsx` | 383 | Skeleton loading system с shimmer-анимациями | Отличный UX |
| `Modal.tsx` | 252 | Базовые form components (InputField, SelectField, SubmitButton) | Полезно, но смешение Modal и Form abstractions |
| `Layout.tsx` | 280 | Sidebar, навигация, тема, роли | Перегружен — стоит разбить |

### Где стек использован хорошо

- TanStack Query — грамотная интеграция
- Feature-based module organization — чёткая структура
- Query keys factory — централизация
- Skeleton loading system — отличный UX

### Где стек перегружен

- God-pages — нет промежуточного уровня feature-компонентов
- Формы без form library — ручной state management
- Hardcoded color strings по всем компонентам (вместо CSS variables)

---

## 6. Prisma / Data-layer аудит

### Schema complexity

10 моделей — адекватно для PM-системы:
- **Core:** User, Team, Project, Task
- **Relations:** TeamMember, ProjectMember, TaskAssignee (junction tables)
- **Features:** CalendarEvent, AuditLog, RefreshToken

Связи логичны: User -> Team -> Project -> Task с many-to-many через junction tables.

### Entity relationships

- Правильные cascade/restrict правила
- Composite unique constraints (`userId_teamId`, `projectId_userId`)
- Корректные indexes на foreign keys и часто фильтруемые поля
- Composite indexes: `[userId, startDate]` для CalendarEvent

### Repository layering

Полный repository pattern:
```
Domain Interface (Symbol token) -> Prisma Implementation -> PrismaService
```

Каждый repository ~100-225 строк. Все имеют `toDomain()` маппинг. Обеспечивает тестируемость, но **добавляет overhead для проекта этого масштаба**.

### Mapping layers

Domain models — anemic interfaces (без логики). Маппинг однонаправленный: Prisma -> Domain. Нет обратного Domain -> Prisma mapper, используются partial types. Допустимо.

### Duplicated types

**Главная проблема data layer.** Типы существуют в трёх местах:

1. **Prisma generated types** (`@prisma/client`)
2. **Domain models** (`backend/src/domain/models/`)
3. **Frontend types** (`frontend/src/app/types/index.ts`)

Нет генерации из единого источника. Рассинхронизация вероятна.

### Query abstraction quality

Prisma repositories используют shared utilities для pagination/search/sort. Read-model сервисы делают прямые Prisma queries для сложных агрегаций. Разумный trade-off.

### Где data layer оправдан

- Schema design — чистая и нормализованная
- Junction tables — правильный подход для many-to-many
- Indexing strategy — покрывает основные запросы
- Read-model прямые queries — оправданная оптимизация для сложных агрегаций

### Где data layer переусложнён

- Repository abstraction — overhead для проекта, не планирующего смену ORM
- Domain models — anemic без логики, фактически дублируют Prisma types
- Three-layer type duplication — системная проблема

---

## 7. Перекрёстные системные проблемы

### 7.1 Frontend God-Pages

| | |
|---|---|
| **Компоненты** | `Projects.tsx`, `Admin.tsx`, `Calendar.tsx`, `Teams.tsx` |
| **Затронутые принципы** | KISS, SRP, DRY |
| **Как проявляется** | Нечитаемый код, сложная навигация, невозможность переиспользования подкомпонентов |
| **Почему системная** | Отсутствует промежуточный уровень feature-компонентов между pages и shared components. Проблема воспроизводится в каждой новой странице |
| **Severity** | **High** |

### 7.2 Triple Type Duplication

| | |
|---|---|
| **Компоненты** | Prisma types, Domain models, Frontend types |
| **Затронутые принципы** | DRY, Бритва Оккама |
| **Как проявляется** | Enum `TaskStatus` определён дважды (backend + frontend); интерфейсы `TaskRiskOutput`/`ProjectRiskOutput` определены дважды |
| **Почему системная** | Нет единого source of truth и автогенерации. Каждое изменение модели требует ручного обновления в 2-3 местах |
| **Severity** | **High** |

### 7.3 Backend God-Services

| | |
|---|---|
| **Компоненты** | `TeamsService` (638 строк), `ProjectsService` (590 строк) |
| **Затронутые принципы** | SRP, KISS |
| **Как проявляется** | CRUD + members + access + audit + cache в одном классе. Высокая когнитивная нагрузка |
| **Почему системная** | Отсутствует выделение member-management и cascade-операций в отдельные сервисы |
| **Severity** | **Medium** |

### 7.4 Duplicate Cache Implementations

| | |
|---|---|
| **Компоненты** | `InMemoryCacheService`, `TtlCacheService` |
| **Затронутые принципы** | DRY, Бритва Оккама, YAGNI |
| **Как проявляется** | 90% идентичный код; два механизма для одной задачи; proactive eviction не подтверждён замерами |
| **Severity** | **Medium** |

---

## 8. Сильные стороны проекта

1. **Backend layered architecture** — чёткое разделение на presentation, application, domain, infrastructure. Каждый слой знает только о соседнем.

2. **Strategy pattern для risk assessment** — `RiskStubService` / `RiskMlService` подключаются через factory в module. Добавление нового провайдера не затрагивает существующий код.

3. **CQRS-light для read-моделей** — view-сервисы (`dashboard`, `project-board`, `reports`) используют оптимизированные read-path запросы, не проходя через domain layer.

4. **Трёхуровневая аутентификация и авторизация** — JWT + Argon2 + token rotation + three-level RBAC. Production-ready security.

5. **TanStack Query integration** — централизованные query keys, smart retry, stale time management.

6. **Comprehensive audit logging** — все значимые операции логируются с `oldValue`/`newValue`.

7. **ML service с graceful degradation** — если ML-сервис недоступен, backend автоматически fallback на rule-based assessment.

8. **Health checks и Docker orchestration** — liveness/readiness probes, dependency health checks, proper startup ordering.

9. **Task state machine** — `ALLOWED_TASK_TRANSITIONS` предотвращает невалидные переходы. Простое и эффективное решение.

10. **Frontend skeleton loading system** — `PageShell.tsx` с shimmer-анимациями для каждого типа страницы.

---

## 9. Приоритизация проблем

### Critical

Нет критических проблем, угрожающих работоспособности или безопасности.

### High

| # | Проблема | Где | Принципы | Почему важно |
|---|---|---|---|---|
| 1 | God-pages на frontend | `Projects` (1084), `Admin` (952), `Calendar` (784), `Teams` (729) | KISS, SRP | Нечитаемый код, невозможность переиспользования, сложность поддержки |
| 2 | Triple type duplication | backend enums <-> frontend types | DRY | Риск рассинхронизации при изменении моделей |
| 3 | God-services на backend | `TeamsService` (638), `ProjectsService` (590) | SRP | Высокая когнитивная нагрузка, сложность тестирования |

### Medium

| # | Проблема | Где | Принципы | Почему важно |
|---|---|---|---|---|
| 4 | Три копипастных access-хука | `useAnalyticsSectionAccess`, `useProjectsSectionAccess`, `useRisksSectionAccess` | DRY | Тройное повторение при любом изменении |
| 5 | Два кэш-сервиса | `InMemoryCacheService`, `TtlCacheService` | DRY, Оккам | Лишняя сущность без доказанной пользы |
| 6 | Pagination helpers дублирование | Сервисы users, teams, audit | DRY | Разрозненные копии одной логики |
| 7 | Repository pattern overhead | `domain/` + `infrastructure/repositories/` | BDUF | ~100-200 строк boilerplate на сущность |
| 8 | E2E тесты не в CI | `ci.yml` | — | Не проверяются автоматически |

### Low

| # | Проблема | Где | Принципы | Почему важно |
|---|---|---|---|---|
| 9 | Legacy Task fields | `frontend/src/app/types/index.ts` | YAGNI | Мёртвый код в интерфейсе |
| 10 | Два API-файла для рисков | `risk.ts` + `risks.ts` | Оккам | Путаница в именах |
| 11 | View-modules overhead | 4 отдельных модуля | KISS | 20 файлов вместо 8 |
| 12 | Duplicate findPage/findPaginated | `audit-logs.prisma.repository.ts` | DRY | Идентичные методы |
| 13 | Нет form library на frontend | Все pages с формами | KISS | Ручной state management |

---

## 10. Рекомендации

### Что упростить

- **Разбить god-pages** на composable feature-компоненты: выделить FormModal, MembersList, SearchableTable как переиспользуемые подкомпоненты
- **Объединить два кэш-сервиса** в один с параметром `{ proactiveEviction: boolean }`
- **Извлечь member management** из `TeamsService` и `ProjectsService` в отдельные `TeamMembersService` и `ProjectMembersService`

### Что объединить

- **Три access-хука** в один `useSectionAccess(requiredRoles: ProjectRole[])` с параметрами
- **Pagination helpers** — переиспользовать существующий `common/query/pagination.ts` вместо копирования в сервисы
- **`risk.ts` + `risks.ts`** на frontend — объединить в один API-файл

### Что удалить

- Legacy `assigneeId`/`assignee` из Task interface (после подтверждения, что миграция завершена)
- Дублирующий `findPaginated` из `audit-logs.prisma.repository.ts`

### Что не трогать

- **Repository pattern на backend** — да, это overhead, но он работает и обеспечивает тестируемость. Удаление потребует рефакторинга всех тестов
- **CQRS view-modules** — спорно, но дают чистое разделение read/write. Работает
- **Strategy pattern для рисков** — образцовое решение, сохранить
- **Трёхуровневая ролевая модель** — дорого, но если требования это предполагают, не трогать
- **Health checks и Docker setup** — production-ready, не упрощать

### Что отложить до появления реальной необходимости

- **Автогенерация типов из OpenAPI/Prisma** — полезно, но требует значительной настройки. Делать, когда frontend/backend типы реально разойдутся
- **Form library (React Hook Form)** — значительный рефакторинг. Делать при следующем крупном UI-изменении
- **E2E тесты в CI** — нужна инфраструктура (Docker-in-Docker или service containers). Делать при настройке staging
- **Model versioning в ML-сервисе** — не нужно, пока нет multiple environments

---

## 11. Итоговый архитектурный verdict

### Соответствие принципам

| Принцип | Оценка | Комментарий |
|---|---|---|
| **KISS** | 6 / 10 | Backend — хорошо. Frontend — серьёзные проблемы с god-pages. Два кэш-сервиса |
| **DRY** | 5 / 10 | Triple type duplication, три копипастных хука, pagination helpers. Серьёзный системный долг |
| **YAGNI** | 8 / 10 | Минимум преждевременных абстракций. Legacy Task fields и optional loadModel — мелочи |
| **BDUF** | 7 / 10 | Repository pattern может быть overdesigned для масштаба, но не мешает |
| **SOLID** | 7 / 10 | DIP и OCP — отличные (strategy, DI). SRP — проблемы в god-services и god-pages. ISP и LSP — хорошо |
| **APO** | 8 / 10 | Кэширование обосновано. Connection pool — спорно, но не вредит |
| **Бритва Оккама** | 7 / 10 | Backend — хорошо. Два кэша и view-modules — лишние сущности |

### Главная архитектурная сила

Backend layered architecture с чистым разделением ответственности, strategy pattern для рисков, и CQRS-light для read-path. Это зрелый, осознанный дизайн.

### Главный архитектурный долг

God-pages на frontend (>700 строк, 4 компонента) и triple type duplication между backend и frontend. Это создаёт maintenance burden, который будет расти нелинейно.

### Зрелость

Проект демонстрирует **высокую инженерную дисциплину на backend** (8.5/10) и **среднюю на frontend** (6/10). Backend архитектура — production-ready. Frontend функционален, но требует декомпозиции page-компонентов для долгосрочной поддерживаемости. ML-интеграция — greyfield с graceful degradation. Инфраструктура — solid, с хорошими health checks и CI, но с пробелом в E2E automation.
