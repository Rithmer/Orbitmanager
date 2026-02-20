# 🗂 TaskMaster — Сервис управления проектами и задачами

Современная full-stack платформа для управления проектами и задачами: создание проектов, распределение задач, отслеживание статусов и аналитика.

**Frontend**: React + TypeScript + Vite + Tailwind CSS
**Backend**: NestJS + TypeScript + JWT
**База данных**: PostgreSQL / MySQL

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react\&logoColor=white\&style=flat-square)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-%5E5-646CFF?logo=vite\&logoColor=white\&style=flat-square)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwindcss\&logoColor=white\&style=flat-square)](https://tailwindcss.com/)
[![NestJS](https://img.shields.io/badge/NestJS-v10-E0234E?logo=nestjs\&logoColor=white\&style=flat-square)](https://nestjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

<p align="center">
  <img src="https://via.placeholder.com/1200x600/0ea5e9/ffffff?text=TaskMaster+—+Главный+экран" alt="Главный экран TaskMaster" width="800"/>
  <br/>
  <em>Современный и адаптивный дизайн с Tailwind CSS</em>
</p>

---

## 2️⃣ Основной функционал

### Пользователь (менеджер / сотрудник)

* Создание и просмотр проектов
* Создание, редактирование и удаление задач
* Назначение задач участникам
* Отслеживание статусов задач (To Do, In Progress, Done)
* Фильтрация и сортировка задач по:

  * Проекту
  * Статусу
  * Дате создания / дедлайну
* Регистрация / авторизация
* Просмотр личного профиля и своих задач

### Администратор / руководитель

* Управление пользователями: добавление, редактирование, удаление
* Просмотр всех проектов и задач
* Назначение ролей и прав доступа
* Просмотр аналитики:

  * Задачи по статусу
  * Прогресс проекта

### Системная логика (backend)

* Управление проектами и задачами:

  * Проверка авторизации и прав доступа
  * Валидация данных
  * Создание / редактирование / удаление записей
  * Обновление статусов задач


---
