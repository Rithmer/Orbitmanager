# Архитектурные паттерны

## CQRS-light

Проект использует упрощённый CQRS (Command Query Responsibility Segregation).

### Правило выбора слоя доступа к данным

| Сценарий | Доступ к данным | Обоснование |
|----------|----------------|-------------|
| Мутация (create/update/delete) | Репозиторий через `@Inject(SYMBOL)` | Единая доменная логика, тестируемость через моки |
| Транзакция из нескольких мутаций | `@Optional() PrismaService` + `$transaction` | Атомарность гарантируется только на уровне Prisma |
| Сложный агрегирующий запрос (read-only) | `PrismaService` напрямую | Агрегации/JOIN'ы не выражаются через CRUD-репозитории |

### Command Services (используют репозитории)
Сервисы, выполняющие мутации, работают через интерфейсы репозиториев:
- `TasksService` → `ITaskRepository`, `IProjectRepository`, `IProjectMemberRepository`
- `ProjectsService` → `IProjectRepository`
- `TeamsService` → `ITeamRepository`, `ITeamMemberRepository`
- `CalendarService` → `ICalendarEventRepository`

Для атомарных операций, требующих транзакций, command services получают
`@Optional() PrismaService` и используют `$transaction` напрямую.

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
| `RiskPageReadModelService` | multi-join: projects + tasks + members для risk page |
