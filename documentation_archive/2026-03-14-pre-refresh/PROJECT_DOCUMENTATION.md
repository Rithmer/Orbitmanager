# Сервис управления проектами и задачами

> **Курсовой проект** — РТУ МИРЭА, Институт перспективных технологий и индустриального программирования  
> **Дисциплина:** Создание программного обеспечения  
> **Студент:** Ким Андрей, ЭФБО-10-24  
> **Руководитель:** Пальчевский Е.В., к.т.н.

---

## Оглавление

1. [Описание проекта](#1-описание-проекта)
2. [Технологический стек](#2-технологический-стек)
3. [Техническое задание](#3-техническое-задание)
   - 3.1 [Цель разработки](#31-цель-разработки)
   - 3.2 [Назначение системы](#32-назначение-системы)
   - 3.3 [Пользователи и роли](#33-пользователи-и-роли)
   - 3.4 [Сущности базы данных](#34-сущности-базы-данных)
   - 3.5 [Бизнес-процессы](#35-бизнес-процессы)
   - 3.6 [Модуль искусственного интеллекта](#36-модуль-искусственного-интеллекта)
   - 3.7 [Функциональные требования](#37-функциональные-требования)
4. [Архитектура](#4-архитектура)
   - 4.1 [Общая архитектура](#41-общая-архитектура)
   - 4.2 [Паттерны и принципы](#42-паттерны-и-принципы)
   - 4.3 [Структура проекта](#43-структура-проекта)
5. [Схема данных](#5-схема-данных)
   - 5.1 [Prisma schema](#51-prisma-schema)
   - 5.2 [Спецификация сущностей](#52-спецификация-сущностей)
   - 5.3 [Enums (перечисления)](#53-enums-перечисления)
6. [RBAC — система прав доступа](#6-rbac--система-прав-доступа)
   - 6.1 [Уровень аккаунта](#61-уровень-аккаунта)
   - 6.2 [Уровень команды](#62-уровень-команды)
   - 6.3 [Матрица прав](#63-матрица-прав)
7. [REST API](#7-rest-api)
8. [Безопасность](#8-безопасность)
9. [Логирование](#9-логирование)
10. [Контейнеризация и развёртывание (Docker)](#10-контейнеризация-и-развёртывание-docker)
11. [Резервное копирование и восстановление](#11-резервное-копирование-и-восстановление)
12. [Тестирование](#12-тестирование)
13. [Запуск проекта](#13-запуск-проекта)
14. [Пользовательская инструкция](#14-пользовательская-инструкция)

---

## Current Status

- Backend runtime is PostgreSQL-only. JSON storage is no longer supported.
- Docker Compose reads infrastructure variables from the root `.env`.
- Copy [backend/.env.example](/c:/Development/Cursovaya/backend/.env.example) to `backend/.env` for host-side backend and Prisma commands.
- Verified host-side PostgreSQL port for this project is `5433`.
- `npm run seed` uses [backend/prisma/seed.ts](/c:/Development/Cursovaya/backend/prisma/seed.ts) and writes to PostgreSQL.
- `POST /auth/refresh` заново проверяет пользователя по `sub` и возвращает `401` для удалённого или `blocked` аккаунта.
- `DELETE /users/:id` возвращает `409`, если у пользователя есть блокирующие зависимости (`teams.createdById`, `tasks.createdById`, `audit_logs.userId`).
- При удалении участника из проекта или команды backend автоматически очищает `tasks.assigneeId`, а при понижении роли команды до `observer` синхронизирует роли в `project_members`.
- Канонический статус нарушения бизнес-правила перехода статуса задачи — `422`.

## 1. Описание проекта

Информационная система «Сервис управления проектами/задачами» автоматизирует процессы планирования, распределения и контроля выполнения задач в командах. Система обеспечивает:

- Управление командами, проектами и задачами с полным жизненным циклом
- Трёхуровневую ролевую модель доступа (аккаунт + команда + проект)
- Аудит всех значимых действий пользователей
- Встроенный ИИ-модуль для прогнозирования сроков и оценки рисков

**Текущее состояние реализации:** backend работает только с PostgreSQL через Prisma. Источником правды для схемы данных является [backend/prisma/schema.prisma](/c:/Development/Cursovaya/backend/prisma/schema.prisma), а JSON-хранилище исключено из runtime и тестового контура.

---

## 2. Технологический стек

| Компонент              | Технология                              |
| ---------------------- | --------------------------------------- |
| **Backend**            | NestJS (TypeScript)                     |
| **Frontend**           | React (TypeScript)                      |
| **Хранение данных**    | PostgreSQL                              |
| **СУБД**               | PostgreSQL 16+                          |
| **ORM**                | Prisma 7                                |
| **Аутентификация**     | JWT (access + refresh)                  |
| **Хэширование**        | argon2                                  |
| **Документация API**   | Swagger / OpenAPI                       |
| **Контейнеризация**    | Docker, Docker Compose                  |
| **Логирование**        | NestJS Logger (Winston)                 |
| **Тестирование**       | Jest (unit + e2e)                       |
| **Runtime**            | Node.js 20+                             |

---

## 3. Техническое задание

### 3.1 Цель разработки

Создание системы управления проектами и задачами с разделённой архитектурой (Frontend → Backend → Database), которая:

- Автоматизирует планирование, контроль выполнения и анализ сроков задач
- Прогнозирует время завершения задач с помощью машинного обучения
- Оценивает вероятность срыва дедлайнов

### 3.2 Назначение системы

Система предназначена для автоматизации процессов управления проектами и задачами:

- Ввод, хранение и обработка данных о проектах и задачах
- Управление полным жизненным циклом задач
- Контроль сроков выполнения
- Назначение исполнителей
- Мониторинг статусов
- Гибкое разграничение прав доступа по ролям
- Полный журнал аудита всех действий

### 3.3 Пользователи и роли

Система использует **трёхуровневую ролевую модель**:

#### Уровень 1 — Роли аккаунта (3 роли)

| Роль       | Описание                                     |
| ---------- | -------------------------------------------- |
| `admin`    | Администратор — глобальный доступ            |
| `member`   | Участник — базовый функционал, создание команд |
| `guest`    | Гость — только регистрация и вход            |

#### Уровень 2 — Роли в команде (3 роли)

| Роль       | Описание                                                                  |
| ---------- | ------------------------------------------------------------------------- |
| `owner`    | Создатель/Глава команды — полный доступ ко всем проектам команды          |
| `member`   | Участник — видит все проекты команды, работает только в назначенных        |
| `observer` | Наблюдатель — видит **только** назначенные проекты и их участников         |

#### Уровень 3 — Роли в проекте (3 роли, через `project_members`)

| Роль        | Кто получает       | Описание                                                     |
| ----------- | ------------------ | ------------------------------------------------------------ |
| `team_lead` | member команды     | Управляет задачами и назначениями в проекте                  |
| `developer` | member команды     | Работает над своими задачами, видит все задачи проекта        |
| `observer`  | observer команды   | Только чтение в рамках проекта                               |

### 3.4 Сущности базы данных

Система содержит **7 основных таблиц**:

| №  | Сущность             | Таблица PostgreSQL   | Описание                            |
| -- | -------------------- | -------------------- | ----------------------------------- |
| 1  | Пользователи         | `users`              | Учётные записи (+ accountRole enum) |
| 2  | Команды              | `teams`              | Команды с создателем                |
| 3  | Участники команды    | `team_members`       | Связь пользователь–команда (+ teamRole enum) |
| 4  | Участники проекта    | `project_members`    | Назначение в проект с проектной ролью |
| 5  | Проекты              | `projects`           | Проекты внутри команд               |
| 6  | Задачи               | `tasks`              | Задачи внутри проектов (+ assigneeId) |
| 7  | Журнал действий      | `audit_logs`         | Аудит всех действий + история статусов |

### 3.5 Бизнес-процессы

#### БП1: Создание и планирование задачи

- **Вход:** название, описание, проект, постановщик (из JWT), плановый срок, сложность
- **Обработка:** проверка прав роли → проверка существования проекта → валидация дедлайна → создание задачи → запись в аудит
- **Результат:** новая запись в таблице `tasks`

#### БП2: Выполнение и изменение статуса задачи

- **Вход:** задача, новый статус, пользователь (из JWT)
- **Обработка:** проверка прав → контроль допустимого перехода статуса → обновление задачи → запись в `audit_logs` (action=`status_change`, oldValue/newValue) → пересчёт риска
- **Результат:** обновлённая задача

#### БП3: Мониторинг проекта и прогнозирование рисков

- **Вход:** открытый проект (дашборд)
- **Обработка:** агрегация данных → запуск модели ИИ → расчёт прогнозов и вероятностей
- **Результат:** дашборд с прогнозами, цветовая индикация рисков

### 3.6 Модуль искусственного интеллекта

Модуль решает две задачи ML:

| Задача                    | Описание                                           |
| ------------------------- | -------------------------------------------------- |
| **Регрессия**             | Прогнозирование оставшегося времени выполнения задачи |
| **Бинарная классификация** | Оценка вероятности нарушения планового дедлайна      |

**Входные признаки:** сложность, дедлайн, статус, наличие исполнителя, нагрузка исполнителя, количество смен статуса, дни с создания, дни до дедлайна.

**Выходные данные:**
- Прогнозируемая дата завершения
- Вероятность срыва дедлайна (0–100%)
- Уровень риска: 🟢 низкий / 🟡 средний / 🔴 высокий

**Этапность:**
1. **Этап 1 (текущий):** rule-based stub — детерминированные правила оценки рисков
2. **Этап 2:** обучение ML-модели на накопленных/синтетических данных, замена провайдера через DI без изменения API

**Подготовка данных для обучения:**
- Источник: данные из БД (tasks, audit_logs) или синтетическая генерация
- Скрипт генерации синтетических данных: `scripts/generate-training-data.ts` — создаёт обучающую выборку на основе статистических распределений (сложность, сроки, наличие исполнителя, вероятность задержки)
- Объём обучающей выборки: ≥ 1000 записей

**Обучение и валидация:**
- Модель: Gradient Boosting (регрессия) + Logistic Regression (классификация)
- Метрики регрессии: MAE (средняя абсолютная ошибка), RMSE, R²
- Метрики классификации: Accuracy, Precision, Recall, F1-score, ROC-AUC
- Разделение данных: 80% train / 20% test

**Сохранение и повторное использование модели:**
- Обученная модель сохраняется в файл `models/risk-model.joblib` (или `.onnx`)
- При запуске системы модель загружается из файла — повторное обучение не требуется
- API: `POST /risk/retrain` — принудительное переобучение (только admin)

**Интерпретация результата для пользователя:**
- Вероятность срыва дедлайна: числовое значение 0–100%
- Уровень риска: цветовая индикация 🟢/🟡/🔴 с текстовым пояснением
- Факторы риска: перечень ключевых причин (например, «высокая сложность», «близкий дедлайн», «перегрузка исполнителей»)
- Рекомендации: краткие советы по снижению риска

### 3.7 Функциональные требования

- Регистрация, авторизация, управление пользователями с ролями
- CRUD для всех сущностей (проекты, задачи, пользователи, команды)
- Поиск, фильтрация, сортировка и пагинация списков
- Разграничение доступа: NestJS Guards + RBAC (2 уровня)
- Полный аудит всех значимых действий
- 3 сквозных бизнес-процесса
- Контроль допустимых переходов статусов

---

## 4. Архитектура

### 4.1 Общая архитектура

```
┌─────────────────┐      HTTP/JSON      ┌─────────────────┐      Repository      ┌─────────────────┐
│   Frontend      │  ←────────────────→ │   Backend       │  ←────────────────→ │   Database      │
│   (React + TS)  │      REST API       │   (NestJS + TS) │      Interface      │   PostgreSQL    │
│   Контейнер 1   │                     │   Контейнер 2   │                     │   Контейнер 3   │
│   (или SPA)     │                     │                 │                     │                 │
└─────────────────┘                     └─────────────────┘                     └─────────────────┘
```

**Три независимых компонента:**
1. **Клиентская часть** — React SPA, отдельное приложение, общается с backend только через REST API
2. **Серверная часть** — NestJS, предоставляет программный интерфейс, содержит всю бизнес-логику
3. **База данных** — отдельный компонент PostgreSQL, поднимаемый локально или в Docker-контейнере

### 4.2 Паттерны и принципы

```
Controller  →  принимает HTTP-запрос и DTO
    ↓
Service     →  бизнес-логика, валидация, RBAC-проверки
    ↓
Repository Interface  →  абстрактный контракт доступа к данным
    ↓
PrismaRepository → реализация через PostgreSQL / Prisma
```

**Обязательные паттерны проектирования (3 из 3):**

1. **MVC (Model-View-Controller)** — основной архитектурный паттерн NestJS:
   - **Model** — домен (domain/models/, enums, DTO)
   - **View** — сериализованный JSON-ответ (REST API)
   - **Controller** — обработка HTTP-запросов, маршрутизация, Swagger-декораторы

2. **Repository Pattern** — слой доступа к данным, инкапсулирующий запросы к хранилищу:
   - Интерфейсы: `domain/repositories/` (контракт)
   - Реализации: `infrastructure/repositories/prisma/`
   - Привязка репозиториев через DI: `infrastructure/storage/storage.module.ts`

3. **Service Layer** — слой бизнес-логики:
   - Правила валидации, RBAC-проверки, транзакции
   - Инкапсулирован в `modules/*/service.ts`
   - Работает поверх контрактов репозиториев, а не прямых SQL-запросов

- **DI (Dependency Injection)** — инъекция зависимостей через модули NestJS

### 4.3 Структура проекта

```
backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   │   └── env.validation.ts
│   ├── common/
│   │   ├── enums/                      # AccountRole, TeamRole, TaskStatus, ...
│   │   ├── guards/                     # JWT, AccountRoles, TeamRoles, ProjectRoles
│   │   ├── decorators/                 # @Roles(), @CurrentUser()
│   │   ├── filters/                    # GlobalExceptionFilter
│   │   ├── interceptors/               # LoggingInterceptor
│   │   ├── helpers/                    # query.helper.ts (фильтрация/пагинация)
│   │   └── exceptions/                 # BusinessException
│   ├── domain/
│   │   ├── models/                     # интерфейсы сущностей (User, Task, ...)
│   │   ├── repositories/               # интерфейсы репозиториев
│   │   └── services/                   # интерфейс IRiskAssessmentService
│   ├── infrastructure/
│   │   ├── prisma/
│   │   │   └── prisma.service.ts       # PrismaClient-обёртка для NestJS
│   │   ├── repositories/
│   │   │   └── prisma/                 # Prisma-реализации репозиториев
│   │   └── storage/
│   │       └── storage.module.ts       # DI-привязка репозиториев
│   └── modules/
│       ├── auth/                       # register, login, refresh
│       ├── users/                      # CRUD пользователей
│       ├── teams/                      # CRUD команд + управление составом
│       ├── projects/                   # CRUD проектов + участники проекта
│       ├── tasks/                      # CRUD задач (+ назначение исполнителя)
│       ├── audit-logs/                 # журнал действий
│       └── risk/                       # оценка рисков / ИИ
├── prisma/
│   ├── schema.prisma                   # схема БД (единая точка правды)
│   ├── prisma.config.ts                # конфиг Prisma 7
│   ├── seed.ts                         # начальные данные (prisma db seed)
│   └── migrations/                     # автогенерируемые миграции
├── scripts/
│   ├── generate-training-data.ts       # генерация синтетических данных для ML
│   ├── docker-entrypoint.sh            # миграции и старт контейнера
│   └── backup.sh                       # backup / restore PostgreSQL
├── test/
│   ├── app.e2e-spec.ts
│   └── e2e/                            # бизнес-сценарии (*.e2e-spec.ts)
├── data/
│   └── training_data.csv               # датасет для ML и тестовых сценариев
├── models/
│   └── risk-model.joblib               # сохранённая ML-модель (после обучения)
├── backups/                            # SQL-дампы PostgreSQL
├── logs/                               # логи приложения
├── Dockerfile                          # контейнер backend
└── .env.example                        # пример переменных окружения backend
```

---

## 5. Схема данных

### 5.1 Prisma schema

Источником правды для схемы данных является [backend/prisma/schema.prisma](/c:/Development/Cursovaya/backend/prisma/schema.prisma).

- Все постоянные данные хранятся в PostgreSQL.
- Prisma-модели `User`, `Team`, `TeamMember`, `Project`, `ProjectMember`, `Task`, `AuditLog` маппятся на таблицы `users`, `teams`, `team_members`, `projects`, `project_members`, `tasks`, `audit_logs`.
- История изменений схемы хранится в [backend/prisma/migrations](/c:/Development/Cursovaya/backend/prisma/migrations).
- Генерация клиента и применение миграций выполняются через `npm run db:generate`, `npm run db:migrate`, `npm run db:migrate:deploy`.

### 5.2 Спецификация сущностей

#### users

| Поле            | Тип      | Ограничения                                  |
| --------------- | -------- | -------------------------------------------- |
| `id`            | `number` | PK, auto-increment                           |
| `login`         | `string` | UNIQUE, NOT NULL, 3–50 символов              |
| `password`      | `string` | NOT NULL, argon2 hash                        |
| `fullName`      | `string` | NOT NULL (ФИО)                               |
| `profession`    | `string` | nullable                                     |
| `accountStatus` | `string` | `active` / `blocked` / `inactive`, default `active` |
| `accountRole`   | `string` | AccountRole enum (`admin` / `member` / `guest`), NOT NULL, default `member` |
| `createdAt`     | `string` | ISO datetime, auto                           |
| `updatedAt`     | `string` | ISO datetime, auto                           |

#### teams

| Поле          | Тип      | Ограничения                    |
| ------------- | -------- | ------------------------------ |
| `id`          | `number` | PK, auto-increment             |
| `name`        | `string` | NOT NULL                       |
| `description` | `string` | nullable                       |
| `createdAt`   | `string` | ISO datetime, auto             |
| `createdById` | `number` | FK → `users.id`, NOT NULL      |

#### team_members

| Поле         | Тип             | Ограничения                             |
| ------------ | --------------- | --------------------------------------- |
| `id`         | `number`        | PK, auto-increment                      |
| `userId`     | `number`        | FK → `users.id`, NOT NULL               |
| `teamId`     | `number`        | FK → `teams.id`, NOT NULL               |
| `teamRole`   | `string`        | TeamRole enum (`owner` / `member` / `observer`), NOT NULL |

**UNIQUE constraint:** `(userId, teamId)` — один пользователь = одна роль в команде.

#### project_members

| Поле         | Тип      | Ограничения                             |
| ------------ | -------- | --------------------------------------- |
| `id`         | `number` | PK, auto-increment                      |
| `projectId`  | `number` | FK → `projects.id`, NOT NULL            |
| `userId`     | `number` | FK → `users.id`, NOT NULL               |
| `role`       | `string` | ProjectRole enum, NOT NULL              |
| `assignedAt` | `string` | ISO datetime, auto                      |

**UNIQUE constraint:** `(projectId, userId)` — один пользователь = одна роль в проекте.

**Правила назначения:**

| team role    | Допустимые project role          |
| ------------ | ---------------------------------- |
| `owner`      | Не нуждается в project_members (полный доступ) |
| `member`     | `team_lead`, `developer`           |
| `observer`   | `observer`                         |

#### projects

| Поле          | Тип      | Ограничения                                  |
| ------------- | -------- | -------------------------------------------- |
| `id`          | `number` | PK, auto-increment                           |
| `teamId`      | `number` | FK → `teams.id`, NOT NULL                    |
| `name`        | `string` | NOT NULL                                     |
| `description` | `string` | nullable                                     |
| `status`      | `string` | `active` / `on_hold` / `completed` / `archived` |
| `createdAt`   | `string` | ISO datetime, auto                           |
| `updatedAt`   | `string` | ISO datetime, auto                           |

#### tasks

| Поле          | Тип      | Ограничения                                 |
| ------------- | -------- | ------------------------------------------- |
| `id`          | `number`        | PK, auto-increment                          |
| `projectId`   | `number`        | FK → `projects.id`, NOT NULL                |
| `name`        | `string`        | NOT NULL                                    |
| `description` | `string`        | nullable                                    |
| `deadline`    | `string`        | ISO datetime, NOT NULL, ≥ `createdAt`       |
| `status`      | `string`        | TaskStatus enum, default `new`              |
| `difficulty`  | `number`        | 1–5, NOT NULL                               |
| `assigneeId`  | `number\|null`  | FK → `users.id`, nullable (исполнитель)     |
| `createdById` | `number`        | FK → `users.id`, NOT NULL (постановщик)     |
| `createdAt`   | `string`        | ISO datetime, auto                          |
| `updatedAt`   | `string`        | ISO datetime, auto                          |

> `assigneeId` — если задан, пользователь должен быть участником проекта (через `project_members`).

#### audit_logs

| Поле          | Тип             | Ограничения                   |
| ------------- | --------------- | ----------------------------- |
| `id`          | `number`        | PK, auto-increment            |
| `userId`      | `number`        | FK → `users.id`, NOT NULL     |
| `action`      | `string`        | AuditAction enum              |
| `entityType`  | `string`        | `task`, `project`, `team`, ... |
| `entityId`    | `number\|null`  | id объекта (null для login)   |
| `oldValue`    | `string\|null`  | предыдущее значение (напр. старый статус) |
| `newValue`    | `string\|null`  | новое значение (напр. новый статус)       |
| `timestamp`   | `string`        | ISO datetime, auto            |
| `description` | `string`        | nullable                      |

### 5.3 Enums (перечисления)

```typescript
// Роли аккаунта
enum AccountRole { ADMIN = 'admin', MEMBER = 'member', GUEST = 'guest' }

// Роли в команде
enum TeamRole { OWNER = 'owner', MEMBER = 'member', OBSERVER = 'observer' }

// Роли в проекте (через project_members)
enum ProjectRole { TEAM_LEAD = 'team_lead', DEVELOPER = 'developer', OBSERVER = 'observer' }

// Статусы задач
enum TaskStatus { NEW = 'new', IN_PROGRESS = 'in_progress', REVIEW = 'review', DONE = 'done', CANCELLED = 'cancelled' }

// Статусы проектов
enum ProjectStatus { ACTIVE = 'active', ON_HOLD = 'on_hold', COMPLETED = 'completed', ARCHIVED = 'archived' }

// Уровни риска
enum RiskLevel { LOW = 'low', MEDIUM = 'medium', HIGH = 'high' }

// Действия аудита
enum AuditAction { CREATE = 'create', UPDATE = 'update', DELETE = 'delete', LOGIN = 'login', LOGOUT = 'logout', ASSIGN = 'assign', STATUS_CHANGE = 'status_change' }
```

**Допустимые переходы статусов задач:**

```
new         → in_progress, cancelled
in_progress → review, cancelled
review      → done, in_progress (возврат на доработку)
done        → (финальный статус)
cancelled   → new (переоткрытие)
```

---

## 6. RBAC — система прав доступа

### 6.1 Уровень аккаунта

| Роль     | Права                                                       |
| -------- | ----------------------------------------------------------- |
| `admin`  | Глобальный доступ, управление пользователями, журнал аудита |
| `member` | Создание команд, участие в командах, просмотр команд        |
| `guest`  | Только `/auth/register` и `/auth/login`                     |

### 6.2 Уровень команды

| Роль       | Права                                                                     |
| ---------- | --------------------------------------------------------------------------- |
| `owner`    | Полный доступ ко ВСЕМ проектам команды, управление составом и ролями      |
| `member`   | Видит все проекты и их участников; работает только в назначенных проектах |
| `observer` | Видит **только** назначенные проекты и их участников                   |

### 6.3 Уровень проекта (project_members)

| Роль        | Права                                                             |
| ----------- | ------------------------------------------------------------------- |
| `team_lead` | Управление задачами, назначениями и разработчиками в проекте    |
| `developer` | Видит все задачи проекта; менять статус может только у своих |
| `observer`  | Только чтение                                                        |

**Цепочка проверки доступа:**

```
JwtAuthGuard → AccountRolesGuard → TeamRolesGuard → ProjectRolesGuard → доменные проверки в Service
```

- `TeamRolesGuard` — проверяет, что пользователь участник команды, получает teamRole
- `ProjectRolesGuard` — проверяет project_members.role; owner автоматически проходит без записи

### 6.4 Матрица прав

| Действие                           | owner | team_lead  | developer  | observer  |
| ---------------------------------- | :---: | :--------: | :--------: | :-------: |
| Управление составом команды        |  ✅   |     ❌     |     ❌     |    ❌     |
| Назначение в проект               |  ✅   |     ❌     |     ❌     |    ❌     |
| Создание проекта                   |  ✅   |     ❌     |     ❌     |    ❌     |
| Удаление проекта                   |  ✅   |     ❌     |     ❌     |    ❌     |
| Редактирование проекта             |  ✅   | ✅ (свой)  |     ❌     |    ❌     |
| Просмотр ВСЕХ проектов команды     |  ✅   |     ✅ *   |    ✅ *    |    ❌     |
| Просмотр назначенного проекта       |  ✅   |     ✅     |     ✅     |    ✅     |
| Просмотр участников проекта        |  ✅   |     ✅ *   |    ✅ *    |   ✅ **   |
| Создание задач                        |  ✅   | ✅ (свой)  |     ❌     |    ❌     |
| Назначение исполнителя (assigneeId)|  ✅   | ✅ (свой)  |     ❌     |    ❌     |
| Изменение статуса задачи           |  ✅   | ✅ (свой)  | ✅ (своя)  |    ❌     |
| Просмотр ВСЕХ задач проекта        |  ✅   | ✅ (свой)  |   ✅ **    |   ✅ **   |
| Удаление команды                   |  ✅   |     ❌     |     ❌     |    ❌     |

> \* `member` (с ролью team_lead/developer) видит **все проекты** команды и всех их участников, но работать может только в проектах, где назначен через `project_members`.  
> \** `observer` видит **только** проекты, к которым `owner` явно дал доступ (через `project_members`). Видит только участников этих проектов. Только чтение.

---

## 7. REST API

### Auth

| Метод  | Endpoint          | Описание                          | Доступ    |
| ------ | ----------------- | --------------------------------- | --------- |
| POST   | `/auth/register`  | Регистрация нового пользователя   | guest     |
| POST   | `/auth/login`     | Вход, получение access + refresh  | guest     |
| POST   | `/auth/refresh`   | Обновление токенов                | any       |

> `POST /auth/refresh` возвращает `401`, если пользователь удалён или заблокирован после выдачи refresh-токена.

### Users

| Метод  | Endpoint      | Описание                   | Доступ |
| ------ | ------------- | -------------------------- | ------ |
| GET    | `/users`      | Список (?search, ?role, ?status, ?page, ?limit, ?sort) | auth |
| GET    | `/users/:id`  | Получить пользователя      | auth   |
| POST   | `/users`      | Создать пользователя       | admin  |
| PATCH  | `/users/:id`  | Редактировать              | admin  |
| DELETE | `/users/:id`  | Удалить (`409`, если есть зависимости) | admin  |

### Teams

| Метод  | Endpoint     | Описание               | Доступ  |
| ------ | ------------ | ---------------------- | ------- |
| GET    | `/teams`     | Список (?search, ?page, ?limit, ?sort) | auth |
| GET    | `/teams/:id` | Получить команду       | auth    |
| POST   | `/teams`     | Создать (auto-owner)   | member+ |
| PATCH  | `/teams/:id` | Редактировать          | owner   |
| DELETE | `/teams/:id` | Удалить                | owner   |

### Team Members

| Метод  | Endpoint                    | Описание                  | Доступ |
| ------ | --------------------------- | ------------------------- | ------ |
| GET    | `/teams/:teamId/members`    | Список участников команды | auth   |
| POST   | `/teams/:teamId/members`    | Добавить участника        | owner  |
| PATCH  | `/team-members/:id`         | Изменить роль в команде  | owner  |
| DELETE | `/team-members/:id`         | Удалить из команды        | owner  |

### Project Members

| Метод  | Endpoint                            | Описание                       | Доступ      |
| ------ | ----------------------------------- | ------------------------------ | ----------- |
| GET    | `/projects/:projectId/members`      | Список участников проекта  | auth *      |
| POST   | `/projects/:projectId/members`      | Назначить в проект          | owner       |
| PATCH  | `/project-members/:id`              | Изменить проектную роль  | owner       |
| DELETE | `/project-members/:id`              | Убрать из проекта            | owner       |

> \* observer видит участников только назначенных ему проектов

### Projects

| Метод  | Endpoint         | Описание                      | Доступ         |
| ------ | ---------------- | ----------------------------- | -------------- |
| GET    | `/projects`      | Список (?teamId, ?status, ?search, ?page, ?limit, ?sort) | auth |
| GET    | `/projects/:id`  | Получить проект               | auth *         |
| POST   | `/projects`      | Создать                       | owner          |
| PATCH  | `/projects/:id`  | Редактировать                 | owner, tl(свой)|
| DELETE | `/projects/:id`  | Удалить                       | owner          |

> \* member видит все проекты команды; observer — только назначенные

### Tasks

| Метод  | Endpoint      | Описание                  | Доступ              |
| ------ | ------------- | ------------------------- | ------------------- |
| GET    | `/tasks`      | Список (?projectId, ?status, ?difficulty, ?assignee, ?search, ?page, ?limit, ?sort) | auth |
| GET    | `/tasks/:id`  | Получить задачу           | owner/tl/dev/obs    |
| POST   | `/tasks`      | Создать                   | owner, tl(свой)     |
| PATCH  | `/tasks/:id`  | Редактировать             | owner, tl, dev(свой статус) |
| DELETE | `/tasks/:id`  | Удалить                   | owner, tl(свой)     |

> Недопустимый переход статуса задачи возвращает `422 Unprocessable Entity`.

### Audit Logs (только чтение)

| Метод | Endpoint       | Описание                              | Доступ |
| ----- | -------------- | ------------------------------------- | ------ |
| GET   | `/audit-logs`  | Журнал (?userId, ?entityType, ?action, ?from, ?to, ?page, ?limit) | admin |

### Risk / AI

| Метод | Endpoint               | Описание             | Доступ |
| ----- | ---------------------- | -------------------- | ------ |
| GET   | `/projects/:id/risk`   | Риски проекта        | auth   |
| GET   | `/tasks/:id/risk`      | Риски задачи         | auth   |

---

## 8. Безопасность

| Мера                       | Реализация                                     |
| -------------------------- | ---------------------------------------------- |
| Хранение паролей           | Только хэш (argon2)                            |
| Аутентификация             | JWT access (15 мин) + refresh (7 дней)          |
| Защита от перебора          | Throttler: 5 попыток / минута                   |
| HTTP-заголовки             | Helmet (стандартные заголовки безопасности)      |
| CORS                       | Настроенные разрешённые домены                  |
| HTTPS                      | TLS-терминация через reverse proxy (nginx) при публикации |
| Валидация DTO              | whitelist=true, forbidNonWhitelisted=true        |
| Stack trace                | Скрыт в production                              |
| ORM / Защита от SQL-инъекций | Prisma с параметризованными запросами (при переходе на PostgreSQL) |
| Аудит                      | Все значимые действия → `audit_logs`             |
| Формат ошибок              | Единый JSON-формат, без утечки внутренних данных |

**Формат ошибок:**

```json
{
  "statusCode": 400,
  "error": "ValidationError",
  "message": "deadline must be in the future",
  "details": [],
  "timestamp": "2026-03-06T10:20:00.000Z"
}
```

---

## 9. Логирование

Система ведёт два типа логов:

### 9.1 Серверное логирование (Winston)

| Уровень | Что логируется                         |
| -------- | ---------------------------------------- |
| `error`  | Необработанные исключения, ошибки БД/файлов |
| `warn`   | Неуспешные попытки авторизации, throttle  |
| `info`   | Запуск/остановка сервера, seed, миграции   |
| `debug`  | HTTP-запросы (method, url, status, ms)   |

- Вывод: `stdout` (development), JSON-файл `logs/app.log` (production)
- `LoggingInterceptor` — логирует каждый HTTP-запрос с временем отклика

### 9.2 Журнал действий пользователей (Audit)

Все значимые действия пользователей сохраняются в `audit_logs` (см. раздел 5.2).

---

## 10. Контейнеризация и развёртывание (Docker)

Система развёртывается через Docker Compose. Компоненты разнесены по отдельным контейнерам.

### 10.1 Состав контейнеров

| Контейнер   | Образ               | Назначение                      |
| ------------ | ------------------- | --------------------------------- |
| `backend`    | node:20-alpine      | NestJS API-сервер               |
| `postgres`   | postgres:16-alpine  | СУБД PostgreSQL                   |
| `frontend`   | node:20-alpine      | React SPA (опционально, nginx)  |

### 10.2 docker-compose.yml (схема)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: taskmanager-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DB_NAME:-task_manager}
      POSTGRES_USER: ${DB_USERNAME:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
    ports:
      - "${DB_PORT:-5433}:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./backend/backups:/backups    # для резервных копий
    networks:
      - app-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USERNAME:-postgres}"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: taskmanager-api
    restart: unless-stopped
    environment:
      PORT: ${PORT:-3000}
      NODE_ENV: ${NODE_ENV:-production}
      JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      JWT_ACCESS_EXPIRES_IN: ${JWT_ACCESS_EXPIRES_IN:-15m}
      JWT_REFRESH_EXPIRES_IN: ${JWT_REFRESH_EXPIRES_IN:-7d}
      DATABASE_URL: postgresql://${DB_USERNAME:-postgres}:${DB_PASSWORD:-postgres}@postgres:5432/${DB_NAME:-task_manager}
      THROTTLE_TTL: ${THROTTLE_TTL:-60000}
      THROTTLE_LIMIT: ${THROTTLE_LIMIT:-60}
      CORS_ORIGIN: ${CORS_ORIGIN:-http://localhost:5173,http://localhost:3000}
      LOG_LEVEL: ${LOG_LEVEL:-info}
    ports:
      - "${PORT:-3000}:3000"
    volumes:
      - ./backend/data:/app/data      # training data / static assets
      - ./backend/logs:/app/logs      # логи приложения
      - ./backend/models:/app/models  # ML-модели
      - ./backend/backups:/app/backups
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - app-network

volumes:
  pgdata:
    driver: local

networks:
  app-network:
    driver: bridge
```

### 10.3 Переменные окружения

| Переменная                | Описание                     | По умолчанию    |
| ----------------------- | ---------------------------- | --------------- |
| `PORT`                  | Порт сервера                 | `3000`          |
| `JWT_ACCESS_SECRET`     | Секрет для access JWT        | —               |
| `JWT_REFRESH_SECRET`    | Секрет для refresh JWT       | —               |
| `JWT_ACCESS_EXPIRES_IN` | Время жизни access-токена    | `15m`           |
| `JWT_REFRESH_EXPIRES_IN`| Время жизни refresh-токена   | `7d`            |
| `DATABASE_URL`          | Строка подключения к PostgreSQL | —            |
| `DB_PORT`               | Порт PostgreSQL на хосте     | `5433`          |
| `DB_NAME`               | Имя базы данных              | `task_manager`  |
| `DB_USERNAME`           | Пользователь БД              | `postgres`      |
| `DB_PASSWORD`           | Пароль БД                    | `postgres`      |

- Root `.env` используется `docker compose` для портов, credentials и переменных контейнеров.
- `backend/.env` используется host-side командами `npm run db:*`, `npm run seed`, `npm run test:e2e`.

### 10.4 Сетевое взаимодействие

- Все контейнеры в общей сети `app-network` (bridge)
- Backend обращается к БД по имени сервиса `postgres:5432`
- Наружу открыты только backend (`3000`) и БД (`5433`, опционально)

### 10.5 Тома хранения данных

| Том          | Назначение                     |
| ------------ | ---------------------------------- |
| `pgdata`     | Данные PostgreSQL (named volume)  |
| `./backend/data`     | training data / static assets (bind mount) |
| `./backend/logs`     | Логи приложения (bind mount)               |
| `./backend/backups`  | SQL-дампы PostgreSQL (bind mount)          |
| `./backend/models`   | ML-модели (bind mount)                     |

### 10.6 Миграции БД

При переходе на PostgreSQL миграции управляются через Prisma CLI:

```bash
# Генерация типизированного клиента
npm run db:generate

# Создание миграции из schema.prisma
npm run db:migrate

# Применение миграций (production / CI / Docker)
npm run db:migrate:deploy

# Синхронизация schema.prisma без миграции
npm run db:push
```

Схема данных описана в `prisma/schema.prisma` — единая точка правды для всех сущностей. Миграции запускаются автоматически при старте backend-контейнера.

### 10.7 Запуск

```bash
# Клонирование
git clone <repo-url>
cd <project-dir>

# Создать root .env для docker compose
# Минимум:
# DB_PORT=5433
# DB_NAME=task_manager
# DB_USERNAME=postgres
# DB_PASSWORD=postgres
# PORT=3000
# JWT_ACCESS_SECRET=dev-access-secret-change-me-in-production
# JWT_REFRESH_SECRET=dev-refresh-secret-change-me-in-production

# Создать backend/.env из backend/.env.example
cp backend/.env.example backend/.env

# Запуск всех контейнеров одной командой
docker compose up -d --build

# Применение миграций
docker compose exec backend npm run db:migrate:deploy

# Начальные данные (seed)
docker compose exec backend npm run seed

# Проверка
docker compose ps
curl http://localhost:3000/api/docs
```

---

## 11. Резервное копирование и восстановление

### 11.1 Резервное копирование

#### PostgreSQL

```bash
# Резервное копирование через backend script
npm run backup

# Или напрямую через Docker
docker compose exec postgres pg_dump -U postgres task_manager > backend/backups/backup_$(date +%Y%m%d_%H%M%S).sql

# По cron (ежедневно в 02:00)
0 2 * * * cd /path/to/project && ./scripts/backup.sh
```

Хранение: последние 7 ежедневных + 4 еженедельных копии.

### 11.2 Восстановление после сбоя

#### PostgreSQL

```bash
# Восстановление из дампа
npm run restore -- backend/backups/pg_20260308_020000.sql.gz
```

### 11.3 Действия администратора при аварийной ситуации

1. **Проверить логи:** `docker compose logs backend --tail=100`
2. **Перезапустить контейнеры:** `docker compose restart`
3. **Проверить БД:** `docker compose exec postgres pg_isready`
4. **Восстановить из дампа** (см. выше) — если данные повреждены
5. **Полный сброс:** `docker compose down -v && docker compose up -d --build && docker compose exec backend npm run seed`

---

## 12. Тестирование

### 12.1 Модульные тесты (Unit)

Покрывают сервисы, гарды, хелперы и репозитории:

```bash
# Запуск всех unit-тестов
npm run test

# С покрытием
npm run test:cov
```

Ключевые тесты:
- `QueryHelper` — фильтрация, сортировка, пагинация
- `TasksService` — валидация переходов статусов, назначение исполнителя
- `AccountRoleGuard`, `TeamRoleGuard`, `ProjectRoleGuard` — проверка доступа
- `AuditService` — запись действий, история статусов (oldValue/newValue)
- `RiskStubService` — корректность оценки рисков
- `Prisma` / PostgreSQL — интеграционный контур хранения и миграций

### 12.2 Сквозные тесты (e2e)

Проверяют 3 бизнес-процесса через HTTP API:

```bash
npm run test:e2e
```

| Тест | Покрытие                                                     |
| ---- | ------------------------------------------------------------ |
| БП1  | register → login → create team → create project → assign to project → create task → audit |
| БП2  | login → create task → set assignee → change status → audit (oldValue/newValue) |
| БП3  | login → create project + tasks → GET /projects/:id/risk            |

---

## 13. Запуск проекта

### Предварительные требования

- Docker 24+ и Docker Compose v2+ (рекомендуемый способ)
- Или: Node.js 20+, npm / yarn / pnpm (локальная разработка)

### Установка

```bash
# Клонировать репозиторий
git clone <repo-url>
cd <project-dir>

# Установить зависимости backend
cd backend
npm install
cd ..
```

### Начальные данные (seed)

```bash
cd backend
npm run seed
```

Создаёт начальные записи в PostgreSQL:
- 1 администратор: login=`admin`, password=`Admin123!`, accountRole=`admin`

### Запуск

```bash
# === Docker (рекомендуемый способ) ===
# 1. Создать root .env рядом с docker-compose.yml
#    и указать DB_PORT=5433, DB_NAME, DB_USERNAME, DB_PASSWORD,
#    JWT_ACCESS_SECRET, JWT_REFRESH_SECRET и другие переменные контейнеров
cp backend/.env.example backend/.env
docker compose up -d --build
docker compose exec backend npm run db:migrate:deploy
docker compose exec backend npm run seed

# === Локально (development) ===
cd backend
npm run db:generate
npm run db:migrate:deploy
npm run start:dev

# === Production ===
cd backend
npm run build
npm run start:prod
```

### Swagger

После запуска документация API доступна по адресу:

```
http://localhost:3000/api/docs
```

### Переменные окружения

См. полный список в [разделе 10.3](#103-переменные-окружения).

---

## 14. Пользовательская инструкция

### 14.1 Регистрация и вход

1. Откройте приложение в браузере (или Swagger: `http://localhost:3000/api/docs`)
2. Зарегистрируйтесь: `POST /auth/register` (логин, пароль ≥ 8 символов, ФИО)
3. Войдите: `POST /auth/login` — получите `accessToken` и `refreshToken`
4. Используйте `accessToken` в заголовке `Authorization: Bearer <token>` для всех последующих запросов

### 14.2 Основной сценарий работы

1. **Создайте команду** (`POST /teams`) — вы автоматически станете owner
2. **Добавьте участников** (`POST /teams/:teamId/members`) с нужными ролями (member/observer)
3. **Создайте проект** (`POST /projects`) внутри команды
4. **Назначьте участников в проект** (`POST /projects/:projectId/members`) с проектными ролями (team_lead/developer/observer)
5. **Создайте задачи** (`POST /tasks`) в проекте, указав `assigneeId` (исполнитель)
6. **Отслеживайте риски** (`GET /projects/:id/risk`, `GET /tasks/:id/risk`)

### 14.3 Роли и возможности

- **owner** — полный контроль команды, проектов, задач, назначений
- **member** — видит все проекты команды, работает только в назначенных (team_lead/developer)
- **observer** — видит только назначенные проекты и их участников, только чтение

### 14.4 Поиск и фильтрация

Во всех списковых endpoint-ах доступны параметры: `?search=`, `?page=`, `?limit=`, `?sort=` и специфичные фильтры (`?status=`, `?teamId=`, `?projectId=` и т.д.).
