# Сервис управления проектами и задачами

Fullstack-курсовой проект для управления командами, проектами и задачами. На текущем этапе основная реализованная часть системы находится в backend: NestJS API, PostgreSQL через Prisma, JWT-аутентификация, RBAC, аудит действий и базовая оценка рисков. Frontend присутствует в репозитории, но пока остаётся каркасом на React/Vite.

Полное техническое описание и расширенная документация вынесены в [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md). История замысла и этапов реализации сохранена в [WORKPLAN.md](WORKPLAN.md).

## Текущий статус

| Компонент | Статус | Комментарий |
| --- | --- | --- |
| Backend | Реализован | NestJS + Prisma + PostgreSQL, JWT auth, RBAC, audit, unit/e2e |
| Frontend | Прототип / каркас | Vite + React, предметный UI пока не реализован |
| Risk / AI | Stub | Есть API и встроенная логика оценки, `retrain` пока заглушка |
| Infra / Docker | Реализовано | Docker Compose, migrations, seed, backup/restore |

## Что есть сейчас

- PostgreSQL — единственное runtime-хранилище backend.
- Основной рабочий интерфейс на текущем этапе — Swagger и HTTP API.
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

- [backend](backend) — основной API, Prisma, тесты и скрипты.
- [frontend](frontend) — клиентский каркас на React/Vite.
- [docker-compose.yml](docker-compose.yml) — основной инфраструктурный контур.
- [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md) — полная документация и описание проекта.
- [WORKPLAN.md](WORKPLAN.md) — история реализации и эволюции решений.

## Быстрый запуск

Рекомендуемый вариант — Docker Compose.

1. Создайте root `.env` рядом с [docker-compose.yml](docker-compose.yml).
2. Создайте `backend/.env` из [backend/.env.example](backend/.env.example).
3. Рекомендуемый хостовый порт PostgreSQL для проекта — `5433`.
4. Запустите:

```bash
docker compose up -d --build
docker compose exec backend npm run db:migrate:deploy
docker compose exec backend npm run seed
```

После запуска:

- Swagger: `http://localhost:3000/api/docs`
- Frontend scaffold: `http://localhost:5173`

Минимальный пример root `.env`:

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
```

Важно:

- root `.env` используется `docker compose`;
- `backend/.env` используется host-side командами backend и Prisma;
- frontend сейчас не является главным рабочим интерфейсом системы.

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

Источник правды по API — Swagger: `http://localhost:3000/api/docs`.

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

- [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md) — полная документация и описание проекта.
- [WORKPLAN.md](WORKPLAN.md) — что планировалось изначально и как проект реализовывался.
- [backend/.env.example](backend/.env.example) — актуальный env-шаблон для backend.
- [backend/prisma/schema.prisma](backend/prisma/schema.prisma) — текущая схема данных.
