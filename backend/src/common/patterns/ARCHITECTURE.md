# Архитектурные паттерны

## CQRS-light

Проект использует упрощённый CQRS (Command Query Responsibility Segregation):

### Command Services (используют репозитории)
Сервисы, выполняющие мутации, работают через интерфейсы репозиториев:
- `TasksService` → `ITaskRepository`, `IProjectRepository`, `IProjectMemberRepository`
- `ProjectsService` → `IProjectRepository`
- `TeamsService` → `ITeamRepository`, `ITeamMemberRepository`
- `CalendarService` → `ICalendarEventRepository`

### Query Services (прямой доступ к Prisma)
Сервисы агрегированного чтения обращаются к `PrismaService` напрямую.
Это намеренное решение — их запросы содержат сложные агрегации,
которые не выражаются через CRUD-репозитории:

| Сервис | Причина прямого доступа |
|--------|------------------------|
| `DashboardService` | 10+ count/findMany с различными фильтрами |
| `ReportsService` | groupBy, statusDistribution, difficultyDistribution |
| `CalendarViewService` | multi-join: projects + tasks + events за период |
| `TeamsListViewService` | paginated team list с членами |
| `ProjectsListViewService` | paginated projects с risk-score агрегацией |
| `ProjectBoardService` | полная проекционная загрузка задач + членов |
