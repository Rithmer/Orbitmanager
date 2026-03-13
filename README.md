# Сервис управления проектами и задачами

Fullstack-курсовой и pet-проект для управления командами, проектами и задачами. Основная реализованная часть системы находится в backend: NestJS API, PostgreSQL через Prisma, JWT-аутентификация, RBAC, аудит действий и базовая оценка рисков. Frontend присутствует в репозитории, но пока остаётся каркасом на React/Vite.

Полное техническое описание и расширенная документация вынесены в [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md). История решений и эволюции проекта сохранена в [WORKPLAN.md](WORKPLAN.md).

## Текущий статус

| Компонент | Статус | Комментарий |
| --- | --- | --- |
| Backend | Реализован | NestJS + Prisma + PostgreSQL, JWT auth, RBAC, audit, unit/e2e |
| Frontend | Прототип / каркас | Vite + React, предметный UI пока не реализован |
| Risk / AI | Stub | Есть API и rule-based логика оценки, `retrain` пока заглушка |
| Infra / Docker | Реализовано | Docker Compose, migrations, auto-seed, backup/restore |

## Что есть сейчас

- PostgreSQL - единственное runtime-хранилище backend.
- Основной рабочий интерфейс на текущем этапе - Swagger и HTTP API.
- Поддерживаются пользователи, команды, проекты, задачи, аудит и risk endpoints.
- Есть unit- и e2e-тесты backend.
- Docker Compose поднимает `postgres`, `backend` и `frontend`.

Ключевые текущие контракты backend:

- `POST /auth/refresh` возвращает `401`, если refresh-токен невалиден, пользователь удалён или аккаунт заблокирован.
- `DELETE /users/:id` возвращает `409`, если у пользователя есть блокирующие зависимости.
- Недопустимый переход статуса задачи возвращает `422`.
- При удалении участника из проекта или команды backend автоматически очищает `tasks.assigneeId`.

## Архитектура

```text
Frontend (React/Vite scaffold)
        |
        v
Backend (NestJS REST API, Swagger, RBAC, Audit, Risk Stub)
        |
        v
PostgreSQL (Prisma)
```

Структура репозитория:

- [backend](backend) - основной API, Prisma, тесты и скрипты.
- [frontend](frontend) - клиентский каркас на React/Vite.
- [docker-compose.yml](docker-compose.yml) - основной инфраструктурный контур.
- [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md) - полная документация и описание проекта.
- [WORKPLAN.md](WORKPLAN.md) - история реализации и эволюции решений.

## Запуск после `git clone`

### Самый быстрый вариант

Если нужен почти мгновенный старт после клонирования, достаточно Docker Desktop / Docker Engine с Compose plugin.

Unix/macOS:

```bash
sh scripts/bootstrap.sh
```

Windows:

```bat
scripts\bootstrap.cmd
```

Что делает bootstrap:

- создаёт root `.env` из [.env.example](.env.example), если его ещё нет;
- создаёт `backend/.env` из [backend/.env.example](backend/.env.example), если его ещё нет;
- запускает `docker compose up -d --build`.

После запуска автоматически выполняются:

- миграции Prisma;
- seed начальных данных;
- старт backend и frontend.

Доступные адреса:

- Swagger: `http://localhost:3000/api/docs`
- Frontend scaffold: `http://localhost:5173`

Seed-пользователь по умолчанию:

- login: `admin`
- password: `Admin123!`

### Запуск без bootstrap-скрипта

Если не хочется использовать скрипты, можно обойтись одной командой:

```bash
docker compose up -d --build
```

Это тоже работает, потому что в `docker-compose.yml` уже заданы dev-friendly значения по умолчанию.

## Переменные окружения

Root [.env.example](.env.example) нужен для `docker compose` и уже содержит рекомендуемые dev-настройки.

Минимальный root `.env`:

```env
DB_PORT=5433
DB_NAME=task_manager
DB_USERNAME=postgres
DB_PASSWORD=postgres
PORT=3000
JWT_ACCESS_SECRET=dev-access-secret-change-me-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-change-me-in-production
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
THROTTLE_TTL=60000
THROTTLE_LIMIT=60
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
LOG_LEVEL=info
AUTO_SEED=true
```

Важно:

- root `.env` использует `docker compose`;
- `backend/.env` используют host-side команды backend и Prisma;
- по умолчанию для Docker рекомендуется `DB_PORT=5433`, чтобы не конфликтовать с локальными инсталляциями PostgreSQL;
- если `.env` не создан, `docker-compose.yml` всё равно поднимет dev-контур через встроенные fallback-значения.

## Основные команды

Backend:

```bash
cd backend
npm run build
npm run test
npm run test:e2e
npm run db:generate
npm run db:migrate:deploy
npm run seed
```

Frontend:

```bash
cd frontend
npm run dev
npm run build
```

## API overview

Источник правды по API - Swagger: `http://localhost:3000/api/docs`.

Основные группы endpoints:

- `Auth`: `/auth/register`, `/auth/login`, `/auth/refresh`
- `Users`: `/users`
- `Teams`: `/teams`, `/teams/:teamId/members`, `/team-members/:id`
- `Projects`: `/projects`, `/projects/:projectId/members`, `/project-members/:id`
- `Tasks`: `/tasks`
- `Audit`: `/audit-logs`
- `Risk`: `/tasks/:id/risk`, `/projects/:id/risk`, `/risk/retrain`

## Ограничения

- Frontend пока не реализует полноценный предметный UI.
- `Risk / AI` пока не является production-ML модулем.
- Детальная учебная постановка, подробная спецификация API и полное описание архитектуры вынесены из `README` в отдельный документ.

## Куда смотреть дальше

- [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md) - полная документация и описание проекта.
- [WORKPLAN.md](WORKPLAN.md) - что планировалось изначально и как проект развивался.
- [backend/.env.example](backend/.env.example) - актуальный env-шаблон для backend.
- [backend/prisma/schema.prisma](backend/prisma/schema.prisma) - текущая схема данных.
