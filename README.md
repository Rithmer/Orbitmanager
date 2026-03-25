# Сервис управления проектами и задачами

Fullstack-курсовой проект для управления командами, проектами, задачами и календарными событиями. Репозиторий содержит NestJS backend с PostgreSQL/Prisma, JWT-аутентификацией, RBAC, аудитом и модулем оценки рисков, а также React/Vite frontend с экранами авторизации, проектов, канбан-доски, календаря и административных разделов.

## Стек

- Backend: NestJS, Prisma, PostgreSQL, JWT, Swagger, Jest
- Frontend: React, TypeScript, Vite, TanStack React Query
- ML Service: Python, FastAPI, scikit-learn, joblib
- Infra: Docker, Docker Compose, Nginx

## Что реализовано

- Пользователи, команды, проекты и задачи
- Роли на уровне аккаунта, команды и проекта
- Канбан-доска проекта
- Календарь событий и дедлайнов
- Аудит действий
- Risk API с ML-моделью (GradientBoosting) и fallback на rule-based логику
- ML-микросервис для оценки рисков задач (FastAPI, отдельный контейнер)
- Админ-панель: управление пользователями, аудит, мониторинг и переобучение ML-модели
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
- ML Service: `http://localhost:8000`
- PostgreSQL: `localhost:5433`

## Переменные окружения

Root [.env.example](.env.example) используется `docker compose` и уже содержит dev-friendly значения по умолчанию.

Один [docker-compose.yml](docker-compose.yml) теперь содержит обычный стек по умолчанию и отдельный профиль:

- обычный стек - основной production-like запуск без профиля
- `e2e` - изолированный e2e-стек на отдельных портах

Ключевые переменные:

- `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`, `DB_PORT`
- `E2E_DB_NAME`, `E2E_DB_USERNAME`, `E2E_DB_PASSWORD`, `E2E_DB_PORT`
- `PORT`, `NODE_ENV`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- `CORS_ORIGIN`
- `THROTTLE_TTL`, `THROTTLE_LIMIT`
- `DB_POOL_MAX`, `DB_POOL_IDLE_TIMEOUT`, `DB_POOL_CONNECTION_TIMEOUT`
- `AUTO_SEED`
- `RISK_PROVIDER` - провайдер оценки рисков: `stub` (по умолчанию, rule-based) или `ml` (ML-модель)
- `ML_SERVICE_URL` - адрес ML-сервиса (по умолчанию `http://ml-service:8000`)
- `ML_SERVICE_PORT` - внешний порт ML-сервиса (по умолчанию `8000`)

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
npm run test
```

ML Service (внутри контейнера или при наличии Python 3.10+):

```bash
cd ml-service
pip install -r requirements.txt
python -m pytest tests/
```

## Docker Compose

Основной стек:

```bash
docker compose up -d --build
```

E2E-стек:

```bash
docker compose -p taskmanager-e2e --profile e2e up -d --build frontend-e2e
```

Остановка нужного стека:

```bash
docker compose down
docker compose -p taskmanager-e2e down
```

Полный сброс e2e-базы:

```bash
docker compose -p taskmanager-e2e down -v
```

Для `e2e` используется адресный запуск сервиса `frontend-e2e`: Compose поднимет его зависимости (`backend-e2e` и `postgres-e2e`), но не затронет обычный стек без профиля.

## Структура

- [backend](backend) - NestJS API, Prisma, тесты и скрипты
- [frontend](frontend) - React/Vite клиент
- [ml-service](ml-service) - Python FastAPI ML-микросервис для оценки рисков
- [docker-compose.yml](docker-compose.yml) - единый docker-compose файл с обычным стеком и профилем `e2e`

## ML-модуль оценки рисков

Система оценки рисков поддерживает два режима работы, переключаемых через переменную `RISK_PROVIDER`:

- **`stub`** (по умолчанию) - детерминированная rule-based логика, не требует ML-сервиса
- **`ml`** - GradientBoosting-модель, обученная на синтетических данных; при недоступности ML-сервиса автоматически переключается на stub

ML-сервис запускается как отдельный Docker-контейнер. Модель обучается при первом запуске и сохраняется в volume `./models`. Переобучение доступно из админ-панели (вкладка "ML Модель") или через `POST /risk/retrain`.

### API ML-сервиса

| Метод | Путь | Описание |
|---|---|---|
| GET | `/health` | Проверка доступности |
| GET | `/model/info` | Информация о модели (версия, метрики, признаки) |
| POST | `/predict` | Оценка риска одной задачи |
| POST | `/predict/batch` | Пакетная оценка рисков (до 1000 задач) |
| POST | `/retrain` | Переобучение модели |

## Ограничения

- ML-модель обучается на синтетических данных; для production-качества необходимы реальные исторические данные.
- UI рабочий, но остаётся учебным и продолжает дорабатываться.
