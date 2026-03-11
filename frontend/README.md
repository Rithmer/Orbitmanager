# Frontend  Сервис управления проектами и задачами

> **Курсовой проект**  РТУ МИРЭА, ЭФБО-10-24, Ким Андрей  
> **Стек:** React 19 + TypeScript + Vite + React Router v7 + Axios

---

## Описание

React SPA  клиентская часть системы управления проектами и задачами.  
Взаимодействует с NestJS-backend исключительно через REST API.

>  **Статус:** Frontend в разработке. Backend API полностью готов и доступен через Swagger: `http://localhost:3000/api/docs`

---

## Технологии

| Пакет | Версия | Назначение |
|-------|--------|------------|
| React | 19.x | UI-фреймворк |
| TypeScript | 5.9.x | Типизация |
| Vite | 7.x | Сборщик / dev-сервер |
| React Router DOM | 7.x | Клиентский роутинг |
| Axios | 1.x | HTTP-клиент |

---

## Запуск

```bash
# Установить зависимости
npm install

# Development-сервер (http://localhost:5173)
npm run dev

# Production сборка
npm run build

# Предпросмотр production сборки
npm run preview
```

---

## Переменные окружения

Создайте файл `.env.local` в папке `frontend/`:

```bash
# URL backend API (по умолчанию локальный dev-сервер)
VITE_API_URL=http://localhost:3000
```

---

## Структура (планируемая)

```
src/
 api/          # Axios-клиент и API-функции
 components/   # Переиспользуемые компоненты
 pages/        # Страницы (маршруты)
 hooks/        # Кастомные React-хуки
 types/        # TypeScript-типы (соответствуют backend DTO)
 utils/        # Вспомогательные функции
```

---

## Связанные ресурсы

- **Backend API (Swagger):** http://localhost:3000/api/docs
- **Основной README:** `../README.md`