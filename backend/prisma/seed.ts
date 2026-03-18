import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as argon2 from 'argon2';

const connectionString =
  process.env['DATABASE_URL'] ??
  'postgresql://postgres:postgres@localhost:5433/task_manager';
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ──────────────────── helpers ────────────────────

function days(n: number): number {
  return n * 24 * 60 * 60 * 1000;
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function futureDate(minDays: number, maxDays: number): Date {
  return new Date(Date.now() + days(randomBetween(minDays, maxDays)));
}

function pastDate(minDays: number, maxDays: number): Date {
  return new Date(Date.now() - days(randomBetween(minDays, maxDays)));
}

// ──────────────────── data ────────────────────

const USERS_DATA = [
  { login: 'admin', fullName: 'Администратор Системы', profession: 'System Administrator', accountRole: 'admin' },
  { login: 'ivanov', fullName: 'Иванов Алексей Петрович', profession: 'Frontend Developer', accountRole: 'member' },
  { login: 'petrova', fullName: 'Петрова Мария Сергеевна', profession: 'Backend Developer', accountRole: 'member' },
  { login: 'sidorov', fullName: 'Сидоров Дмитрий Андреевич', profession: 'Fullstack Developer', accountRole: 'member' },
  { login: 'kuznetsova', fullName: 'Кузнецова Анна Игоревна', profession: 'UI/UX Designer', accountRole: 'member' },
  { login: 'volkov', fullName: 'Волков Никита Олегович', profession: 'DevOps Engineer', accountRole: 'member' },
  { login: 'morozova', fullName: 'Морозова Елена Викторовна', profession: 'QA Engineer', accountRole: 'member' },
  { login: 'novikov', fullName: 'Новиков Артём Дмитриевич', profession: 'Project Manager', accountRole: 'member' },
  { login: 'fedorova', fullName: 'Фёдорова Ольга Александровна', profession: 'Data Analyst', accountRole: 'member' },
  { login: 'sokolov', fullName: 'Соколов Кирилл Максимович', profession: 'Mobile Developer', accountRole: 'member' },
  { login: 'kozlova', fullName: 'Козлова Дарья Романовна', profession: 'Tech Writer', accountRole: 'member' },
  { login: 'lebedev', fullName: 'Лебедев Павел Станиславович', profession: 'System Analyst', accountRole: 'member' },
  { login: 'egorova', fullName: 'Егорова Виктория Николаевна', profession: 'Scrum Master', accountRole: 'member' },
  { login: 'popov', fullName: 'Попов Роман Юрьевич', profession: 'Backend Developer', accountRole: 'member' },
  { login: 'vasilev', fullName: 'Васильев Иван Сергеевич', profession: 'Frontend Developer', accountRole: 'member' },
  { login: 'smirnova', fullName: 'Смирнова Наталья Павловна', profession: 'QA Lead', accountRole: 'member' },
  { login: 'orlov', fullName: 'Орлов Максим Алексеевич', profession: 'Database Admin', accountRole: 'member' },
  { login: 'andreeva', fullName: 'Андреева Светлана Вадимовна', profession: 'Product Owner', accountRole: 'member' },
  { login: 'baranov', fullName: 'Баранов Денис Игоревич', profession: 'Security Engineer', accountRole: 'member' },
  { login: 'nikolaev', fullName: 'Николаев Егор Константинович', profession: 'ML Engineer', accountRole: 'member' },
  { login: 'observer1', fullName: 'Зайцев Владимир Петрович', profession: 'Stakeholder', accountRole: 'member' },
  { login: 'observer2', fullName: 'Белова Ирина Олеговна', profession: 'Investor Relations', accountRole: 'member' },
  { login: 'guest1', fullName: 'Гостев Тимофей Сергеевич', profession: '', accountRole: 'guest' },
];

interface TeamDef {
  name: string;
  description: string;
  ownerIdx: number;
  members: { userIdx: number; teamRole: string }[];
  projects: ProjectDef[];
}

interface ProjectDef {
  name: string;
  description: string;
  status: string;
  members: { userIdx: number; role: string }[];
  tasks: TaskDef[];
}

interface TaskDef {
  name: string;
  description: string;
  difficulty: number;
  status: string;
  assigneeIdx: number | null;
  deadlineDaysFromNow: number;
}

const TEAMS: TeamDef[] = [
  {
    name: 'Frontend Core',
    description: 'Команда фронтенд-разработки: React, TypeScript, UI-компоненты',
    ownerIdx: 1,
    members: [
      { userIdx: 4, teamRole: 'member' },
      { userIdx: 14, teamRole: 'member' },
      { userIdx: 6, teamRole: 'member' },
      { userIdx: 20, teamRole: 'observer' },
    ],
    projects: [
      {
        name: 'UI Component Library',
        description: 'Библиотека переиспользуемых UI-компонентов на React',
        status: 'active',
        members: [
          { userIdx: 1, role: 'team_lead' },
          { userIdx: 4, role: 'developer' },
          { userIdx: 14, role: 'developer' },
          { userIdx: 20, role: 'observer' },
        ],
        tasks: [
          { name: 'Создать компонент Button', description: 'Варианты: primary, secondary, ghost, danger', difficulty: 2, status: 'done', assigneeIdx: 4, deadlineDaysFromNow: -5 },
          { name: 'Создать компонент Modal', description: 'Модальное окно с анимацией и overlay', difficulty: 3, status: 'done', assigneeIdx: 14, deadlineDaysFromNow: -3 },
          { name: 'Компонент DataTable', description: 'Таблица с сортировкой, фильтрацией и пагинацией', difficulty: 5, status: 'in_progress', assigneeIdx: 1, deadlineDaysFromNow: 14 },
          { name: 'Компонент DatePicker', description: 'Выбор даты и времени с поддержкой диапазонов', difficulty: 4, status: 'in_progress', assigneeIdx: 4, deadlineDaysFromNow: 10 },
          { name: 'Компонент Toast/Notification', description: 'Всплывающие уведомления с auto-dismiss', difficulty: 2, status: 'new', assigneeIdx: 14, deadlineDaysFromNow: 21 },
          { name: 'Написать Storybook stories', description: 'Документация для всех компонентов в Storybook', difficulty: 3, status: 'new', assigneeIdx: null, deadlineDaysFromNow: 30 },
        ],
      },
      {
        name: 'Landing Page Redesign',
        description: 'Редизайн посадочной страницы продукта',
        status: 'active',
        members: [
          { userIdx: 4, role: 'team_lead' },
          { userIdx: 14, role: 'developer' },
          { userIdx: 6, role: 'developer' },
        ],
        tasks: [
          { name: 'Дизайн макета Hero секции', description: 'Новый hero-блок с анимацией', difficulty: 3, status: 'done', assigneeIdx: 4, deadlineDaysFromNow: -10 },
          { name: 'Адаптивная вёрстка', description: 'Mobile-first адаптация всех секций', difficulty: 4, status: 'in_progress', assigneeIdx: 14, deadlineDaysFromNow: 7 },
          { name: 'Интеграция с аналитикой', description: 'Google Analytics 4 + Яндекс.Метрика', difficulty: 2, status: 'new', assigneeIdx: 6, deadlineDaysFromNow: 14 },
          { name: 'SEO-оптимизация', description: 'Meta-теги, OpenGraph, структурированные данные', difficulty: 3, status: 'new', assigneeIdx: null, deadlineDaysFromNow: 21 },
          { name: 'Тестирование на кросс-браузерность', description: 'Chrome, Firefox, Safari, Edge', difficulty: 2, status: 'new', assigneeIdx: 6, deadlineDaysFromNow: 18 },
        ],
      },
    ],
  },
  {
    name: 'Backend Platform',
    description: 'Серверная разработка: NestJS, API, микросервисы',
    ownerIdx: 2,
    members: [
      { userIdx: 3, teamRole: 'member' },
      { userIdx: 13, teamRole: 'member' },
      { userIdx: 16, teamRole: 'member' },
      { userIdx: 21, teamRole: 'observer' },
    ],
    projects: [
      {
        name: 'REST API v2',
        description: 'Разработка нового API с улучшенной архитектурой',
        status: 'active',
        members: [
          { userIdx: 2, role: 'team_lead' },
          { userIdx: 3, role: 'developer' },
          { userIdx: 13, role: 'developer' },
          { userIdx: 16, role: 'developer' },
          { userIdx: 21, role: 'observer' },
        ],
        tasks: [
          { name: 'Миграция на Prisma ORM', description: 'Перевод слоя данных с JSON на PostgreSQL через Prisma', difficulty: 5, status: 'done', assigneeIdx: 2, deadlineDaysFromNow: -15 },
          { name: 'Реализовать пагинацию cursor-based', description: 'Keyset pagination для больших датасетов', difficulty: 4, status: 'in_progress', assigneeIdx: 3, deadlineDaysFromNow: 10 },
          { name: 'Rate limiting по API key', description: 'Индивидуальные лимиты для каждого клиента', difficulty: 3, status: 'in_progress', assigneeIdx: 13, deadlineDaysFromNow: 12 },
          { name: 'WebSocket нотификации', description: 'Real-time уведомления через Socket.IO', difficulty: 4, status: 'new', assigneeIdx: 16, deadlineDaysFromNow: 25 },
          { name: 'Кэширование Redis', description: 'Кэш для частых запросов (списки, справочники)', difficulty: 4, status: 'new', assigneeIdx: 3, deadlineDaysFromNow: 20 },
          { name: 'Health checks и метрики', description: 'Prometheus метрики + health endpoint', difficulty: 2, status: 'review', assigneeIdx: 16, deadlineDaysFromNow: 5 },
          { name: 'API versioning', description: 'Поддержка v1/v2 через URL prefix', difficulty: 3, status: 'new', assigneeIdx: null, deadlineDaysFromNow: 30 },
        ],
      },
    ],
  },
  {
    name: 'DevOps & Infrastructure',
    description: 'CI/CD, мониторинг, инфраструктура, контейнеризация',
    ownerIdx: 5,
    members: [
      { userIdx: 18, teamRole: 'member' },
      { userIdx: 16, teamRole: 'member' },
    ],
    projects: [
      {
        name: 'CI/CD Pipeline',
        description: 'Автоматизация сборки, тестирования и деплоя',
        status: 'active',
        members: [
          { userIdx: 5, role: 'team_lead' },
          { userIdx: 18, role: 'developer' },
          { userIdx: 16, role: 'developer' },
        ],
        tasks: [
          { name: 'GitHub Actions workflow', description: 'Build → test → lint → deploy pipeline', difficulty: 4, status: 'done', assigneeIdx: 5, deadlineDaysFromNow: -20 },
          { name: 'Docker multi-stage build', description: 'Оптимизация размера образов', difficulty: 3, status: 'done', assigneeIdx: 18, deadlineDaysFromNow: -12 },
          { name: 'Kubernetes манифесты', description: 'Deployment, Service, Ingress для prod', difficulty: 5, status: 'in_progress', assigneeIdx: 5, deadlineDaysFromNow: 15 },
          { name: 'Настройка Grafana дашборда', description: 'Мониторинг CPU/RAM/latency/errors', difficulty: 3, status: 'new', assigneeIdx: 18, deadlineDaysFromNow: 20 },
          { name: 'SSL сертификаты auto-renew', description: 'Let\'s Encrypt + cert-manager', difficulty: 2, status: 'new', assigneeIdx: 16, deadlineDaysFromNow: 25 },
          { name: 'Backup автоматизация', description: 'Ежедневные бекапы БД в S3', difficulty: 3, status: 'review', assigneeIdx: 5, deadlineDaysFromNow: 3 },
        ],
      },
    ],
  },
  {
    name: 'QA & Testing',
    description: 'Тестирование, автоматизация тестов, обеспечение качества',
    ownerIdx: 15,
    members: [
      { userIdx: 6, teamRole: 'member' },
      { userIdx: 12, teamRole: 'member' },
      { userIdx: 20, teamRole: 'observer' },
    ],
    projects: [
      {
        name: 'Test Automation Framework',
        description: 'Фреймворк для автоматизации E2E тестов',
        status: 'active',
        members: [
          { userIdx: 15, role: 'team_lead' },
          { userIdx: 6, role: 'developer' },
          { userIdx: 12, role: 'developer' },
          { userIdx: 20, role: 'observer' },
        ],
        tasks: [
          { name: 'Playwright setup', description: 'Настройка Playwright для E2E тестирования', difficulty: 3, status: 'done', assigneeIdx: 15, deadlineDaysFromNow: -8 },
          { name: 'Page Object Model', description: 'Создать POM для основных страниц', difficulty: 4, status: 'in_progress', assigneeIdx: 6, deadlineDaysFromNow: 8 },
          { name: 'API тесты (Supertest)', description: 'Покрытие всех endpoints E2E тестами', difficulty: 4, status: 'in_progress', assigneeIdx: 12, deadlineDaysFromNow: 12 },
          { name: 'Тесты безопасности OWASP', description: 'Проверка на основные уязвимости', difficulty: 5, status: 'new', assigneeIdx: null, deadlineDaysFromNow: 30 },
          { name: 'Отчётность Allure', description: 'Интеграция Allure Reporter с CI', difficulty: 2, status: 'new', assigneeIdx: 6, deadlineDaysFromNow: 18 },
        ],
      },
    ],
  },
  {
    name: 'Mobile Team',
    description: 'Мобильная разработка: React Native, iOS, Android',
    ownerIdx: 9,
    members: [
      { userIdx: 3, teamRole: 'member' },
      { userIdx: 14, teamRole: 'member' },
      { userIdx: 4, teamRole: 'member' },
    ],
    projects: [
      {
        name: 'Мобильное приложение v1',
        description: 'Мобильный клиент управления задачами на React Native',
        status: 'active',
        members: [
          { userIdx: 9, role: 'team_lead' },
          { userIdx: 3, role: 'developer' },
          { userIdx: 14, role: 'developer' },
          { userIdx: 4, role: 'developer' },
        ],
        tasks: [
          { name: 'Экран авторизации', description: 'Login/Register с biometric auth', difficulty: 3, status: 'done', assigneeIdx: 9, deadlineDaysFromNow: -14 },
          { name: 'Список задач', description: 'Экран со списком задач, pull-to-refresh, infinite scroll', difficulty: 4, status: 'done', assigneeIdx: 3, deadlineDaysFromNow: -7 },
          { name: 'Push-уведомления', description: 'Firebase Cloud Messaging для Android и iOS', difficulty: 4, status: 'in_progress', assigneeIdx: 14, deadlineDaysFromNow: 10 },
          { name: 'Оффлайн режим', description: 'SQLite + синхронизация при подключении', difficulty: 5, status: 'new', assigneeIdx: 3, deadlineDaysFromNow: 28 },
          { name: 'Тёмная тема', description: 'Dark mode с системными настройками', difficulty: 2, status: 'in_progress', assigneeIdx: 4, deadlineDaysFromNow: 6 },
          { name: 'Экран календаря', description: 'Календарь событий с drag-and-drop', difficulty: 4, status: 'new', assigneeIdx: 9, deadlineDaysFromNow: 21 },
        ],
      },
    ],
  },
  {
    name: 'Data & Analytics',
    description: 'Аналитика, отчёты, работа с данными, BI',
    ownerIdx: 8,
    members: [
      { userIdx: 19, teamRole: 'member' },
      { userIdx: 11, teamRole: 'member' },
    ],
    projects: [
      {
        name: 'Analytics Dashboard',
        description: 'Дашборд с метриками продукта и аналитикой',
        status: 'active',
        members: [
          { userIdx: 8, role: 'team_lead' },
          { userIdx: 19, role: 'developer' },
          { userIdx: 11, role: 'developer' },
        ],
        tasks: [
          { name: 'KPI виджеты', description: 'Карточки с ключевыми показателями', difficulty: 3, status: 'done', assigneeIdx: 8, deadlineDaysFromNow: -6 },
          { name: 'Графики активности', description: 'Chart.js графики: задачи по дням, burndown', difficulty: 4, status: 'in_progress', assigneeIdx: 19, deadlineDaysFromNow: 8 },
          { name: 'Экспорт в CSV/PDF', description: 'Выгрузка отчётов в разных форматах', difficulty: 3, status: 'new', assigneeIdx: 11, deadlineDaysFromNow: 16 },
          { name: 'Фильтры по периоду', description: 'Выбор периода: неделя/месяц/квартал/custom', difficulty: 2, status: 'in_progress', assigneeIdx: 8, deadlineDaysFromNow: 5 },
          { name: 'Email отчёты', description: 'Автоматическая рассылка еженедельных отчётов', difficulty: 4, status: 'new', assigneeIdx: null, deadlineDaysFromNow: 28 },
        ],
      },
    ],
  },
  {
    name: 'Security Team',
    description: 'Информационная безопасность, аудит, compliance',
    ownerIdx: 18,
    members: [
      { userIdx: 5, teamRole: 'member' },
      { userIdx: 13, teamRole: 'member' },
      { userIdx: 21, teamRole: 'observer' },
    ],
    projects: [
      {
        name: 'Security Audit 2026',
        description: 'Комплексный аудит безопасности системы',
        status: 'active',
        members: [
          { userIdx: 18, role: 'team_lead' },
          { userIdx: 5, role: 'developer' },
          { userIdx: 13, role: 'developer' },
          { userIdx: 21, role: 'observer' },
        ],
        tasks: [
          { name: 'Pentest веб-приложения', description: 'Тестирование на проникновение: XSS, CSRF, SQLi', difficulty: 5, status: 'in_progress', assigneeIdx: 18, deadlineDaysFromNow: 14 },
          { name: 'Ревью JWT реализации', description: 'Проверка безопасности токенов, ротация, хранение', difficulty: 4, status: 'done', assigneeIdx: 13, deadlineDaysFromNow: -4 },
          { name: 'RBAC аудит', description: 'Проверка корректности разграничения прав', difficulty: 3, status: 'in_progress', assigneeIdx: 5, deadlineDaysFromNow: 10 },
          { name: 'Логирование security events', description: 'Мониторинг подозрительной активности', difficulty: 4, status: 'new', assigneeIdx: 18, deadlineDaysFromNow: 22 },
          { name: 'Compliance checklist', description: 'Подготовка документации соответствия стандартам', difficulty: 2, status: 'new', assigneeIdx: null, deadlineDaysFromNow: 30 },
          { name: 'Dependency audit', description: 'npm audit + Snyk сканирование зависимостей', difficulty: 2, status: 'review', assigneeIdx: 5, deadlineDaysFromNow: 3 },
        ],
      },
    ],
  },
  {
    name: 'Product Management',
    description: 'Управление продуктом, roadmap, приоритизация',
    ownerIdx: 7,
    members: [
      { userIdx: 17, teamRole: 'member' },
      { userIdx: 12, teamRole: 'member' },
      { userIdx: 10, teamRole: 'member' },
    ],
    projects: [
      {
        name: 'Product Roadmap Q2 2026',
        description: 'Планирование функционала на второй квартал',
        status: 'active',
        members: [
          { userIdx: 7, role: 'team_lead' },
          { userIdx: 17, role: 'developer' },
          { userIdx: 12, role: 'developer' },
          { userIdx: 10, role: 'developer' },
        ],
        tasks: [
          { name: 'Анализ обратной связи', description: 'Систематизация фидбэка от пользователей', difficulty: 2, status: 'done', assigneeIdx: 7, deadlineDaysFromNow: -10 },
          { name: 'Приоритизация фич (RICE)', description: 'Скоринг backlog методом RICE', difficulty: 3, status: 'done', assigneeIdx: 17, deadlineDaysFromNow: -5 },
          { name: 'User Story Mapping', description: 'Карта пользовательских историй для Q2', difficulty: 3, status: 'in_progress', assigneeIdx: 12, deadlineDaysFromNow: 7 },
          { name: 'Конкурентный анализ', description: 'Сравнение с Jira, Asana, ClickUp, Notion', difficulty: 3, status: 'in_progress', assigneeIdx: 10, deadlineDaysFromNow: 10 },
          { name: 'OKR планирование', description: 'Objectives and Key Results для команды', difficulty: 2, status: 'new', assigneeIdx: 7, deadlineDaysFromNow: 14 },
          { name: 'Презентация для стейкхолдеров', description: 'Подготовка квартального отчёта', difficulty: 2, status: 'new', assigneeIdx: 17, deadlineDaysFromNow: 20 },
        ],
      },
    ],
  },
  {
    name: 'AI & ML',
    description: 'Машинное обучение, модели прогнозирования, data science',
    ownerIdx: 19,
    members: [
      { userIdx: 8, teamRole: 'member' },
      { userIdx: 11, teamRole: 'member' },
      { userIdx: 20, teamRole: 'observer' },
    ],
    projects: [
      {
        name: 'Risk Prediction Model',
        description: 'ML-модель прогнозирования рисков срыва дедлайнов',
        status: 'active',
        members: [
          { userIdx: 19, role: 'team_lead' },
          { userIdx: 8, role: 'developer' },
          { userIdx: 11, role: 'developer' },
          { userIdx: 20, role: 'observer' },
        ],
        tasks: [
          { name: 'Сбор данных для обучения', description: 'Генерация синтетического датасета (1000+ записей)', difficulty: 3, status: 'done', assigneeIdx: 19, deadlineDaysFromNow: -12 },
          { name: 'Feature engineering', description: 'Выделение признаков: сложность, дедлайн, нагрузка', difficulty: 4, status: 'done', assigneeIdx: 8, deadlineDaysFromNow: -7 },
          { name: 'Обучение Gradient Boosting', description: 'Регрессионная модель для прогноза времени', difficulty: 5, status: 'in_progress', assigneeIdx: 19, deadlineDaysFromNow: 10 },
          { name: 'Logistic Regression классификатор', description: 'Бинарная классификация: срыв/не-срыв', difficulty: 4, status: 'in_progress', assigneeIdx: 8, deadlineDaysFromNow: 12 },
          { name: 'Валидация модели', description: 'Cross-validation, метрики: F1, AUC-ROC, MAE', difficulty: 3, status: 'new', assigneeIdx: 11, deadlineDaysFromNow: 18 },
          { name: 'REST API для inference', description: 'Эндпоинты для получения предсказаний', difficulty: 3, status: 'new', assigneeIdx: null, deadlineDaysFromNow: 25 },
          { name: 'A/B тест rule-based vs ML', description: 'Сравнение текущего stub с ML-моделью', difficulty: 3, status: 'new', assigneeIdx: 19, deadlineDaysFromNow: 30 },
        ],
      },
    ],
  },
  {
    name: 'Documentation',
    description: 'Техническая и пользовательская документация',
    ownerIdx: 10,
    members: [
      { userIdx: 7, teamRole: 'member' },
      { userIdx: 12, teamRole: 'member' },
    ],
    projects: [
      {
        name: 'Technical Documentation',
        description: 'Техническая документация API и архитектуры',
        status: 'active',
        members: [
          { userIdx: 10, role: 'team_lead' },
          { userIdx: 7, role: 'developer' },
          { userIdx: 12, role: 'developer' },
        ],
        tasks: [
          { name: 'Swagger полная документация', description: 'Описание всех endpoints с примерами', difficulty: 3, status: 'done', assigneeIdx: 10, deadlineDaysFromNow: -8 },
          { name: 'Архитектурная схема', description: 'Диаграммы C4: контекст, контейнеры, компоненты', difficulty: 3, status: 'in_progress', assigneeIdx: 12, deadlineDaysFromNow: 7 },
          { name: 'Гайд по развёртыванию', description: 'Пошаговая инструкция: Docker, env, миграции', difficulty: 2, status: 'done', assigneeIdx: 7, deadlineDaysFromNow: -3 },
          { name: 'Пользовательская инструкция', description: 'Руководство для конечных пользователей', difficulty: 3, status: 'in_progress', assigneeIdx: 10, deadlineDaysFromNow: 14 },
          { name: 'Changelog и Release Notes', description: 'Автоматизация CHANGELOG из коммитов', difficulty: 2, status: 'new', assigneeIdx: null, deadlineDaysFromNow: 21 },
          { name: 'Contributing guide', description: 'Правила контрибуции в проект', difficulty: 1, status: 'new', assigneeIdx: 12, deadlineDaysFromNow: 18 },
        ],
      },
    ],
  },
];

const EVENT_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

// ──────────────────── main ────────────────────

async function main(): Promise<void> {
  console.log('Cleaning database...');
  await prisma.calendarEvent.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();

  // Reset sequences
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE users_id_seq RESTART WITH 1`);
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE teams_id_seq RESTART WITH 1`);
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE team_members_id_seq RESTART WITH 1`);
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE projects_id_seq RESTART WITH 1`);
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE project_members_id_seq RESTART WITH 1`);
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE tasks_id_seq RESTART WITH 1`);
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE audit_logs_id_seq RESTART WITH 1`);
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE calendar_events_id_seq RESTART WITH 1`);

  // ── Users ──
  console.log('Creating users...');
  const password = await argon2.hash('Password123!');
  const adminPassword = await argon2.hash('Admin123!');

  const userIds: number[] = [];
  for (const u of USERS_DATA) {
    const created = await prisma.user.create({
      data: {
        login: u.login,
        password: u.login === 'admin' ? adminPassword : password,
        fullName: u.fullName,
        profession: u.profession,
        accountStatus: 'active',
        accountRole: u.accountRole,
      },
    });
    userIds.push(created.id);
  }
  console.log(`  Created ${userIds.length} users`);

  // ── Teams, Members, Projects, Tasks ──
  let totalTeams = 0;
  let totalMembers = 0;
  let totalProjects = 0;
  let totalTasks = 0;
  let totalEvents = 0;

  for (const teamDef of TEAMS) {
    console.log(`Creating team: ${teamDef.name}...`);
    const ownerId = userIds[teamDef.ownerIdx];

    const team = await prisma.team.create({
      data: {
        name: teamDef.name,
        description: teamDef.description,
        createdById: ownerId,
      },
    });
    totalTeams++;

    // Owner as team member
    await prisma.teamMember.create({
      data: { userId: ownerId, teamId: team.id, teamRole: 'owner' },
    });
    totalMembers++;

    // Other members
    for (const m of teamDef.members) {
      await prisma.teamMember.create({
        data: {
          userId: userIds[m.userIdx],
          teamId: team.id,
          teamRole: m.teamRole,
        },
      });
      totalMembers++;
    }

    // Projects
    for (const projDef of teamDef.projects) {
      const project = await prisma.project.create({
        data: {
          teamId: team.id,
          name: projDef.name,
          description: projDef.description,
          status: projDef.status,
        },
      });
      totalProjects++;

      // Project members
      for (const pm of projDef.members) {
        await prisma.projectMember.create({
          data: {
            projectId: project.id,
            userId: userIds[pm.userIdx],
            role: pm.role,
          },
        });
      }

      // Tasks
      for (const taskDef of projDef.tasks) {
        const deadline =
          taskDef.deadlineDaysFromNow >= 0
            ? futureDate(taskDef.deadlineDaysFromNow, taskDef.deadlineDaysFromNow + 2)
            : pastDate(-taskDef.deadlineDaysFromNow - 2, -taskDef.deadlineDaysFromNow);

        const createdAt =
          taskDef.status === 'done'
            ? pastDate(20, 30)
            : taskDef.status === 'in_progress' || taskDef.status === 'review'
              ? pastDate(7, 15)
              : pastDate(1, 5);

        const assigneeId = taskDef.assigneeIdx !== null ? userIds[taskDef.assigneeIdx] : null;
        const creatorId = userIds[teamDef.ownerIdx];

        const task = await prisma.task.create({
          data: {
            projectId: project.id,
            name: taskDef.name,
            description: taskDef.description,
            deadline,
            status: taskDef.status,
            difficulty: taskDef.difficulty,
            assigneeId,
            createdById: creatorId,
            createdAt,
          },
        });
        totalTasks++;

        // Audit log for task creation
        await prisma.auditLog.create({
          data: {
            userId: creatorId,
            action: 'create',
            entityType: 'task',
            entityId: task.id,
            description: `Создана задача "${task.name}"`,
            timestamp: createdAt,
          },
        });

        // Status change audit if not 'new'
        if (taskDef.status !== 'new') {
          const transitions: Record<string, string[]> = {
            in_progress: ['new', 'in_progress'],
            review: ['new', 'in_progress', 'review'],
            done: ['new', 'in_progress', 'review', 'done'],
          };
          const chain = transitions[taskDef.status];
          if (chain) {
            for (let i = 1; i < chain.length; i++) {
              await prisma.auditLog.create({
                data: {
                  userId: assigneeId ?? creatorId,
                  action: 'status_change',
                  entityType: 'task',
                  entityId: task.id,
                  oldValue: chain[i - 1],
                  newValue: chain[i],
                  description: `Статус задачи "${task.name}": ${chain[i - 1]} → ${chain[i]}`,
                  timestamp: new Date(
                    createdAt.getTime() + days(i * 2),
                  ),
                },
              });
            }
          }
        }

        // Calendar event for tasks with deadlines (50% chance)
        if (assigneeId && Math.random() > 0.5) {
          const eventStart = new Date(deadline.getTime() - days(1));
          await prisma.calendarEvent.create({
            data: {
              userId: assigneeId,
              projectId: project.id,
              taskId: task.id,
              title: `Дедлайн: ${taskDef.name}`,
              description: `Крайний срок задачи "${taskDef.name}"`,
              startDate: eventStart,
              endDate: deadline,
              allDay: true,
              color: pick(EVENT_COLORS),
            },
          });
          totalEvents++;
        }
      }
    }
  }

  // ── Standalone calendar events (meetings, standups, etc.) ──
  console.log('Creating standalone calendar events...');

  const meetingEvents = [
    { title: 'Daily Standup', desc: 'Ежедневный стендап команды', recurring: 5 },
    { title: 'Sprint Planning', desc: 'Планирование спринта на 2 недели', recurring: 1 },
    { title: 'Sprint Retrospective', desc: 'Ретроспектива завершённого спринта', recurring: 1 },
    { title: 'Code Review Session', desc: 'Совместное код-ревью', recurring: 2 },
    { title: '1-on-1 с тимлидом', desc: 'Индивидуальная встреча', recurring: 1 },
    { title: 'Demo для заказчика', desc: 'Демонстрация нового функционала', recurring: 1 },
    { title: 'Tech Talk: TypeScript', desc: 'Внутренний доклад по advanced TypeScript', recurring: 1 },
    { title: 'Workshop: Docker', desc: 'Мастер-класс по контейнеризации', recurring: 1 },
  ];

  for (const evt of meetingEvents) {
    for (let i = 0; i < evt.recurring; i++) {
      const userId = userIds[randomBetween(1, 19)];
      const start = futureDate(i * 3 + 1, i * 3 + 5);
      start.setHours(randomBetween(9, 16), 0, 0, 0);
      const durationHours = randomBetween(1, 2);
      const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);

      await prisma.calendarEvent.create({
        data: {
          userId,
          title: evt.title,
          description: evt.desc,
          startDate: start,
          endDate: end,
          allDay: false,
          color: pick(EVENT_COLORS),
        },
      });
      totalEvents++;
    }
  }

  // Personal events for various users
  const personalEvents = [
    'Отпуск', 'Больничный', 'Обучение', 'Конференция', 'Хакатон',
    'Собеседование кандидата', 'Подготовка отчёта', 'Обновление документации',
  ];

  for (const title of personalEvents) {
    const userId = userIds[randomBetween(1, 19)];
    const start = futureDate(1, 30);
    const isAllDay = Math.random() > 0.5;

    if (isAllDay) {
      start.setHours(0, 0, 0, 0);
      const end = new Date(start.getTime() + days(randomBetween(1, 3)));
      await prisma.calendarEvent.create({
        data: {
          userId,
          title,
          description: '',
          startDate: start,
          endDate: end,
          allDay: true,
          color: pick(EVENT_COLORS),
        },
      });
    } else {
      start.setHours(randomBetween(9, 17), 0, 0, 0);
      const end = new Date(start.getTime() + randomBetween(1, 3) * 60 * 60 * 1000);
      await prisma.calendarEvent.create({
        data: {
          userId,
          title,
          description: '',
          startDate: start,
          endDate: end,
          allDay: false,
          color: pick(EVENT_COLORS),
        },
      });
    }
    totalEvents++;
  }

  // Login audit for all users
  for (let i = 0; i < userIds.length - 1; i++) {
    await prisma.auditLog.create({
      data: {
        userId: userIds[i],
        action: 'login',
        entityType: 'auth',
        entityId: null,
        description: `Пользователь ${USERS_DATA[i].login} вошёл в систему`,
        timestamp: pastDate(0, 3),
      },
    });
  }

  console.log('\n── Seed complete ──');
  console.log(`  Users:           ${userIds.length}`);
  console.log(`  Teams:           ${totalTeams}`);
  console.log(`  Team Members:    ${totalMembers}`);
  console.log(`  Projects:        ${totalProjects}`);
  console.log(`  Tasks:           ${totalTasks}`);
  console.log(`  Calendar Events: ${totalEvents}`);
  console.log('\n  Login credentials:');
  console.log('  admin / Admin123!');
  console.log('  Any other user / Password123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
