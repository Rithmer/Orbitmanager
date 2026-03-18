# Сервис управления проектами и задачами

Fullstack-курсовой проект для управления командами, проектами, задачами и календарными событиями. Репозиторий содержит NestJS backend с PostgreSQL/Prisma, JWT-аутентификацией, RBAC, аудитом и модулем оценки рисков, а также React/Vite frontend с экранами авторизации, проектов, канбан-доски, календаря и административных разделов.

## Стек

- Backend: NestJS, Prisma, PostgreSQL, JWT, Swagger, Jest
- Frontend: React, TypeScript, Vite
- Infra: Docker, Docker Compose, Nginx

## Что реализовано

- Пользователи, команды, проекты и задачи
- Роли на уровне аккаунта, команды и проекта
- Канбан-доска проекта
- Календарь событий и дедлайнов
- Аудит действий
- Risk API с rule-based/stub логикой
- Docker-окружение для локального запуска

## Быстрый старт

Самый простой запуск:

Unix/macOS:

```bash
sh scripts/bootstrap.sh
```

Windows:

```bat
scripts\bootstrap.cmd
```

Bootstrap-скрипты создают `.env` из [.env.example](.env.example), при необходимости создают `backend/.env` из [backend/.env.example](backend/.env.example) и запускают `docker compose up -d --build`.

Если скрипты не нужны, можно запустить стек напрямую:

```bash
docker compose up -d --build
```

После запуска доступны:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`
- Swagger: `http://localhost:5173/api/docs`
- PostgreSQL: `localhost:5433`

## Переменные окружения

Root [.env.example](.env.example) используется `docker compose` и уже содержит dev-friendly значения по умолчанию.

Ключевые переменные:

- `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`, `DB_PORT`
- `E2E_DB_NAME`, `E2E_DB_USERNAME`, `E2E_DB_PASSWORD`, `E2E_DB_PORT`
- `PORT`, `NODE_ENV`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- `CORS_ORIGIN`
- `THROTTLE_TTL`, `THROTTLE_LIMIT`
- `DB_POOL_MAX`, `DB_POOL_IDLE_TIMEOUT`, `DB_POOL_CONNECTION_TIMEOUT`
- `AUTO_SEED`

Файл [backend/.env.example](backend/.env.example) нужен для локального запуска backend-команд вне Docker.

## Основные команды

Backend:

```bash
cd backend
npm run db:generate
npm run build
npm run test
npm run test:e2e
```

Frontend:

```bash
cd frontend
npm run dev
npm run build
```

## E2E-контур

Для изолированного e2e-окружения используется [docker-compose.e2e.yml](docker-compose.e2e.yml).

Запуск:

```bash
docker compose -f docker-compose.e2e.yml up -d --build
```

Остановка:

```bash
docker compose -f docker-compose.e2e.yml down
```

Полный сброс e2e-базы:

```bash
docker compose -f docker-compose.e2e.yml down -v
```

## Структура

- [backend](backend) - NestJS API, Prisma, тесты и скрипты
- [frontend](frontend) - React/Vite клиент
- [docker-compose.yml](docker-compose.yml) - основной docker-стек
- [docker-compose.e2e.yml](docker-compose.e2e.yml) - изолированный e2e-стек

## Ограничения

- Модуль оценки рисков пока использует stub/rule-based реализацию, а не production ML.
- UI уже рабочий, но остаётся учебным и продолжает дорабатываться.
