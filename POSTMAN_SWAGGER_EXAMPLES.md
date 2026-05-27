# Postman / Swagger

## Links

- Backend API: `http://localhost:3000`
- Backend Swagger: `http://localhost:5173/api/docs`
- Backend Swagger direct: `http://localhost:3000/api/docs`
- ML API: `http://localhost:8000`
- ML Swagger: `http://localhost:8000/docs`

## Tokens

```text
<ACCESS_TOKEN>
<ADMIN_TOKEN>
<REFRESH_TOKEN>
```

## Health / Auth

### `GET /`

```bash
curl "http://localhost:3000/"
```

### `GET /health/live`

```bash
curl "http://localhost:3000/health/live"
```

### `GET /health/ready`

```bash
curl "http://localhost:3000/health/ready"
```

### `POST /auth/register`

```bash
curl -X POST "http://localhost:3000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "login": "anna_pm",
    "password": "SprintDemo2026!",
    "fullName": "Анна Смирнова",
    "profession": "Product Manager"
  }'
```

### `POST /auth/login`

```bash
curl -X POST "http://localhost:3000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "login": "anna_pm",
    "password": "SprintDemo2026!"
  }'
```

### `GET /auth/me`

```bash
curl "http://localhost:3000/auth/me" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### `POST /auth/refresh`

```bash
curl -X POST "http://localhost:3000/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<REFRESH_TOKEN>"
  }'
```

### `POST /auth/logout`

```bash
curl -X POST "http://localhost:3000/auth/logout" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<REFRESH_TOKEN>"
  }'
```

### `POST /auth/change-password`

```bash
curl -X POST "http://localhost:3000/auth/change-password" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "SprintDemo2026!",
    "newPassword": "SprintDemo2026!_Updated"
  }'
```

## Users

### `GET /users`

```bash
curl "http://localhost:3000/users?search=anna&page=1&limit=10&sort=fullName&accountRole=member" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### `GET /users/{id}`

```bash
curl "http://localhost:3000/users/2" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### `POST /users`

```bash
curl -X POST "http://localhost:3000/users" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "login": "olga_qa",
    "password": "QADemo2026!",
    "fullName": "Ольга Лебедева",
    "profession": "QA Engineer",
    "accountStatus": "active",
    "accountRole": "member"
  }'
```

### `PATCH /users/{id}`

```bash
curl -X PATCH "http://localhost:3000/users/2" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Ольга Лебедева",
    "profession": "Senior QA Engineer",
    "accountStatus": "active",
    "accountRole": "member"
  }'
```

### `PATCH /users/me`

```bash
curl -X PATCH "http://localhost:3000/users/me" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Анна Смирнова",
    "profession": "Product Owner",
    "avatarUrl": "https://cdn.example.com/avatars/anna-smirnova.png"
  }'
```

### `DELETE /users/{id}`

```bash
curl -X DELETE "http://localhost:3000/users/2" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

## Teams

### `GET /teams`

```bash
curl "http://localhost:3000/teams?search=platform&page=1&limit=10&sort=name" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### `GET /teams/{id}`

```bash
curl "http://localhost:3000/teams/1" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### `POST /teams`

```bash
curl -X POST "http://localhost:3000/teams" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Platform Crew",
    "description": "Команда платформы, уведомлений и внутренних интеграций"
  }'
```

### `PATCH /teams/{id}`

```bash
curl -X PATCH "http://localhost:3000/teams/1" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Platform Core Crew",
    "description": "Основная команда платформы и внутренних сервисов"
  }'
```

### `DELETE /teams/{id}`

```bash
curl -X DELETE "http://localhost:3000/teams/1" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### `GET /teams/list-view`

```bash
curl "http://localhost:3000/teams/list-view?search=platform&page=1&limit=12&sort=name" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### `GET /teams/members/batch`

```bash
curl "http://localhost:3000/teams/members/batch?teamIds=1,2" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### `GET /teams/{teamId}/members`

```bash
curl "http://localhost:3000/teams/1/members" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### `POST /teams/{teamId}/members`

```bash
curl -X POST "http://localhost:3000/teams/1/members" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 2,
    "teamRole": "member"
  }'
```

### `PATCH /teams/{teamId}/members/{id}`

```bash
curl -X PATCH "http://localhost:3000/teams/1/members/1" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "teamRole": "observer"
  }'
```

### `PATCH /team-members/{id}`

```bash
curl -X PATCH "http://localhost:3000/team-members/1" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "teamRole": "member"
  }'
```

### `DELETE /teams/{teamId}/members/{id}`

```bash
curl -X DELETE "http://localhost:3000/teams/1/members/1" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### `DELETE /team-members/{id}`

```bash
curl -X DELETE "http://localhost:3000/team-members/1" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## Projects

### `GET /projects`

```bash
curl "http://localhost:3000/projects?search=release&teamId=1&status=active&page=1&limit=10&sort=-updatedAt" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### `GET /projects/{id}`

```bash
curl "http://localhost:3000/projects/1" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### `POST /projects`

```bash
curl -X POST "http://localhost:3000/projects" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": 1,
    "name": "Release 2026.2",
    "description": "Подготовка летнего релиза с новыми уведомлениями и отчетами",
    "status": "active"
  }'
```

### `PATCH /projects/{id}`

```bash
curl -X PATCH "http://localhost:3000/projects/1" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Release 2026.2 Core",
    "description": "Релиз сфокусирован на уведомлениях, аналитике и стабильности",
    "status": "on_hold"
  }'
```

### `DELETE /projects/{id}`

```bash
curl -X DELETE "http://localhost:3000/projects/1" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### `GET /projects/list-view`

```bash
curl "http://localhost:3000/projects/list-view?search=release&teamId=1&status=active&page=1&limit=12&sort=-updatedAt" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### `GET /projects/{id}/board-view`

```bash
curl "http://localhost:3000/projects/1/board-view" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### `GET /projects/members/batch`

```bash
curl "http://localhost:3000/projects/members/batch?projectIds=1,2" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### `GET /projects/{projectId}/members`

```bash
curl "http://localhost:3000/projects/1/members" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### `POST /projects/{projectId}/members`

```bash
curl -X POST "http://localhost:3000/projects/1/members" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 2,
    "role": "developer"
  }'
```

### `PATCH /projects/{projectId}/members/{id}`

```bash
curl -X PATCH "http://localhost:3000/projects/1/members/1" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "observer"
  }'
```

### `PATCH /project-members/{id}`

```bash
curl -X PATCH "http://localhost:3000/project-members/1" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "developer"
  }'
```

### `DELETE /projects/{projectId}/members/{id}`

```bash
curl -X DELETE "http://localhost:3000/projects/1/members/1" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### `DELETE /project-members/{id}`

```bash
curl -X DELETE "http://localhost:3000/project-members/1" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## Tasks

### `GET /tasks`

```bash
curl "http://localhost:3000/tasks?projectId=1&status=in_progress&difficulty=4&assigneeId=2&page=1&limit=20&sort=-deadline" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### `GET /tasks/{id}`

```bash
curl "http://localhost:3000/tasks/1" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### `POST /tasks`

```bash
curl -X POST "http://localhost:3000/tasks" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": 1,
    "name": "Настроить уведомления о дедлайнах",
    "description": "Реализовать email и in-app уведомления за 48 и 24 часа до дедлайна",
    "deadline": "2026-06-15T09:00:00.000Z",
    "difficulty": 4,
    "assigneeIds": [2, 3]
  }'
```

### `PATCH /tasks/{id}`

```bash
curl -X PATCH "http://localhost:3000/tasks/1" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Настроить уведомления о дедлайнах и рисках",
    "description": "Добавить email, in-app и системные предупреждения для задач с высоким риском",
    "deadline": "2026-06-20T09:00:00.000Z",
    "status": "in_progress",
    "difficulty": 5,
    "assigneeIds": [2]
  }'
```

### `DELETE /tasks/{id}`

```bash
curl -X DELETE "http://localhost:3000/tasks/1" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### `GET /tasks/{id}/risk`

```bash
curl "http://localhost:3000/tasks/1/risk" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## Calendar / Dashboard / Reports

### `GET /calendar-events`

```bash
curl "http://localhost:3000/calendar-events?projectId=1&from=2026-04-01T00:00:00.000Z&to=2026-04-30T23:59:59.000Z&page=1&limit=20&sort=startDate" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### `GET /calendar-events/{id}`

```bash
curl "http://localhost:3000/calendar-events/1" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### `POST /calendar-events`

```bash
curl -X POST "http://localhost:3000/calendar-events" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Планирование релиза 2026.2",
    "description": "Финальное планирование задач, рисков и ответственных",
    "startDate": "2026-04-10T10:00:00.000Z",
    "endDate": "2026-04-10T11:30:00.000Z",
    "allDay": false,
    "color": "#0ea5e9",
    "projectId": 1,
    "taskId": 1
  }'
```

### `PATCH /calendar-events/{id}`

```bash
curl -X PATCH "http://localhost:3000/calendar-events/1" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Перепланирование релиза 2026.2",
    "description": "Сдвиг сроков из-за блокера по интеграциям",
    "startDate": "2026-04-11T12:00:00.000Z",
    "endDate": "2026-04-11T13:00:00.000Z",
    "allDay": false,
    "color": "#ef4444",
    "projectId": 1,
    "taskId": 1
  }'
```

### `DELETE /calendar-events/{id}`

```bash
curl -X DELETE "http://localhost:3000/calendar-events/1" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### `GET /calendar/month-view`

```bash
curl "http://localhost:3000/calendar/month-view?year=2026&month=4&projectId=1" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### `GET /dashboard/summary`

```bash
curl "http://localhost:3000/dashboard/summary" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### `GET /reports/projects`

```bash
curl "http://localhost:3000/reports/projects" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### `GET /reports/summary`

```bash
curl "http://localhost:3000/reports/summary?projectId=1" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### `GET /audit-logs`

```bash
curl "http://localhost:3000/audit-logs?entityType=task&action=STATUS_CHANGE&page=1&limit=20&sort=-timestamp" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

## Risk

### `GET /projects/{id}/risk`

```bash
curl "http://localhost:3000/projects/1/risk" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### `GET /projects/{id}/tasks-risk`

```bash
curl "http://localhost:3000/projects/1/tasks-risk" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### `GET /risks/projects`

```bash
curl "http://localhost:3000/risks/projects?projectIds=1,2" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### `GET /risk/ml-status`

```bash
curl "http://localhost:3000/risk/ml-status" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### `POST /risk/retrain`

```bash
curl -X POST "http://localhost:3000/risk/retrain" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

## ML Service

### `GET /health`

```bash
curl "http://localhost:8000/health"
```

### `GET /model/info`

```bash
curl "http://localhost:8000/model/info"
```

### `POST /predict`

```bash
curl -X POST "http://localhost:8000/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "task": {
      "taskId": 101,
      "difficulty": 4,
      "deadline": "2026-06-15T09:00:00.000Z",
      "createdAt": "2026-03-30T09:00:00.000Z",
      "status": "in_progress",
      "assigneeCount": 2,
      "assigneeLoad": 5,
      "statusChangesCount": 3,
      "daysSinceCreation": 12,
      "daysUntilDeadline": 18
    }
  }'
```

### `POST /predict/batch`

```bash
curl -X POST "http://localhost:8000/predict/batch" \
  -H "Content-Type: application/json" \
  -d '{
    "tasks": [
      {
        "taskId": 101,
        "difficulty": 4,
        "deadline": "2026-06-15T09:00:00.000Z",
        "createdAt": "2026-03-30T09:00:00.000Z",
        "status": "in_progress",
        "assigneeCount": 2,
        "assigneeLoad": 5,
        "statusChangesCount": 3,
        "daysSinceCreation": 12,
        "daysUntilDeadline": 18
      },
      {
        "taskId": 102,
        "difficulty": 2,
        "deadline": "2026-05-20T12:00:00.000Z",
        "createdAt": "2026-04-02T12:00:00.000Z",
        "status": "new",
        "assigneeCount": 1,
        "assigneeLoad": 1,
        "statusChangesCount": 0,
        "daysSinceCreation": 4,
        "daysUntilDeadline": 21
      }
    ]
  }'
```

### `POST /retrain`

```bash
curl -X POST "http://localhost:8000/retrain" \
  -H "Content-Type: application/json" \
  -d '{
    "sample_size": 8000
  }'
```
