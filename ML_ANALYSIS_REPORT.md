# Технический анализ ML-части проекта

## 1. Executive summary

| Параметр | Значение |
|----------|----------|
| **Расположение ML** | Отдельный Python-микросервис `ml-service/` (FastAPI, порт 8000) |
| **Задача** | Оценка рисков срыва сроков задач в системе управления проектами |
| **Входные данные** | 10 полей о задаче → трансформируются в 11 числовых признаков |
| **Модель** | GradientBoostingRegressor (scikit-learn), 200 деревьев |
| **Raw output модели** | Одно число `delayProbability` (float 0.0–1.0) |
| **Итоговый ответ** | 5 полей: delayProbability, riskLevel, riskFactors, recommendation, predictedCompletionDate |
| **Интеграция** | Backend вызывает ML по HTTP; при недоступности — автоматический fallback на rule-based логику |
| **Обучение** | На синтетических данных с rule-based labels |

---

## 2. Архитектура ML-части

### 2.1 Файловая структура

```
Cursovaya/
├── ml-service/                          # ML-микросервис (Python)
│   ├── app/
│   │   ├── main.py                      # FastAPI-приложение, 6 endpoints
│   │   ├── model.py                     # ModelManager: загрузка, predict, retrain
│   │   ├── training.py                  # Обучение GradientBoosting на синтетике
│   │   ├── features.py                  # Извлечение 11 признаков
│   │   └── schemas.py                   # Pydantic-модели запросов/ответов
│   ├── tests/                           # Тесты ML-сервиса
│   ├── requirements.txt
│   └── Dockerfile
│
├── models/                              # Артефакты модели
│   ├── risk_model.joblib                # Сериализованная модель (~1.2 MB)
│   └── risk_model_meta.json             # Метаданные (дата, метрики, features)
│
├── backend/src/modules/risk/            # Backend-интеграция (TypeScript, NestJS)
│   ├── ml-client.service.ts             # HTTP-клиент к ML-сервису
│   ├── risk-ml.service.ts               # ML-провайдер с fallback на stub
│   ├── risk-stub.service.ts             # Rule-based fallback
│   ├── risk.controller.ts               # HTTP-эндпоинты для клиента
│   ├── risk.module.ts                   # DI-модуль, выбор провайдера
│   ├── helpers/
│   │   └── build-task-risk-input.ts     # Преобразование Task → TaskRiskInput
│   └── dto/
│       ├── task-risk-output.dto.ts      # DTO ответа по задаче
│       └── project-risk-output.dto.ts   # DTO ответа по проекту
│
├── backend/src/domain/services/
│   └── risk-assessment.interface.ts     # Контракт IRiskAssessmentService
│
└── docker-compose.yml                   # ml-service контейнер
```

### 2.2 Связь ML и backend

ML-сервис и backend — **два отдельных Docker-контейнера**, связанных только по HTTP.

Выбор провайдера определяется переменной окружения:

```
RISK_PROVIDER=ml   → RiskMlService (с runtime fallback на stub)
RISK_PROVIDER=stub → RiskStubService (ML не используется)
```

Оба провайдера реализуют единый интерфейс `IRiskAssessmentService` с тремя методами:
- `assessTask(input)` — оценка одной задачи
- `assessProject(projectId)` — оценка проекта (агрегация по задачам)
- `assessProjectsBatch(projectIds)` — оценка нескольких проектов

---

## 3. Полный поток работы ML

### 3.1 Single prediction (`GET /tasks/:id/risk`)

```
Клиент → HTTP GET /tasks/:id/risk
           │
           ▼
   RiskController.getTaskRisk()
   ├── Загружает Task из БД
   ├── Проверяет доступ пользователя к проекту
   ├── Загружает audit_logs для задачи → считает statusChangesCount
   ├── Загружает все задачи проекта → считает assigneeLoad
   └── buildTaskRiskInput(task, statusChangesCount, assigneeLoad)
           │
           ▼
   TaskRiskInput (10 полей)
           │
           ▼
   RiskMlService.assessTask(input)
   └── MlClientService.predict(input)
       └── HTTP POST http://ml-service:8000/predict { task: input }
           │
           ▼
   ML-сервис (Python)
   ├── Pydantic-валидация входных данных
   ├── extract_features(task) → numpy array [1 x 11]
   ├── model.predict(features) → raw_prob (float)
   ├── clamp(raw_prob, 0.0, 1.0) → delayProbability
   ├── _get_risk_level(delayProbability) → riskLevel
   ├── _get_risk_factors(task) → riskFactors (rule-based)
   ├── _get_recommendation(riskFactors, riskLevel) → recommendation
   └── _predict_completion_date(task, delayProbability) → predictedCompletionDate
           │
           ▼
   JSON-ответ ML → RiskMlService → RiskController → клиент
```

### 3.2 Project prediction (`GET /projects/:id/risk`)

```
Клиент → HTTP GET /projects/:id/risk
           │
           ▼
   RiskMlService.assessProject(projectId)
   ├── Загружает проект и все его задачи из БД
   ├── Фильтрует активные задачи (не DONE, не CANCELLED)
   ├── Загружает audit_logs для всех активных задач
   ├── Для каждой задачи: buildTaskRiskInput()
   └── mlClient.predictBatch(allInputs)
       └── HTTP POST /predict/batch (1 вызов для всех задач)
           │
           ▼
   ML-сервис: один model.predict(matrix[N x 11]) → N результатов
           │
           ▼
   RiskMlService.buildProjectRiskFromResults()
   ├── Для каждой задачи: если delayProbability > 0.3 → в список tasksAtRisk
   ├── riskScore = round(avg(delayProbability) × 100)
   ├── riskLevel = high(>60) / medium(>30) / low
   └── summary = текстовое описание
           │
           ▼
   ProjectRiskOutputDto → клиент
```

### 3.3 Multi-project batch (`GET /risks/projects?projectIds=1,2,3`)

Аналогично project prediction, но:
- Все задачи всех запрошенных проектов загружаются за 2 DB-запроса
- **Один HTTP-вызов** к ML для всех задач всех проектов
- Результаты агрегируются по каждому проекту отдельно

---

## 4. Входные данные модели

### 4.1 Поля TaskRiskInput (формируются в backend)

| # | Поле | Тип | Источник | Как формируется |
|---|------|-----|---------|----------------|
| 1 | `taskId` | int | БД, `tasks.id` | Напрямую из модели Task |
| 2 | `difficulty` | int (1–5) | БД, `tasks.difficulty` | Напрямую из модели Task |
| 3 | `deadline` | string (ISO) | БД, `tasks.deadline` | Напрямую |
| 4 | `createdAt` | string (ISO) | БД, `tasks.createdAt` | Напрямую |
| 5 | `status` | string | БД, `tasks.status` | Напрямую |
| 6 | `assigneeCount` | int (>=0) | БД, `tasks.assigneeIds` | `task.assigneeIds.length` |
| 7 | `assigneeLoad` | int (>=0) | **Вычисляется в backend** | Макс. кол-во активных задач у самого загруженного исполнителя данной задачи (в рамках проекта, не считая саму задачу) |
| 8 | `statusChangesCount` | int (>=0) | **Из audit_log** | Кол-во записей с `action = STATUS_CHANGE` для данной задачи |
| 9 | `daysSinceCreation` | int | **Вычисляется** | `floor((now - createdAt) / 86400000)` |
| 10 | `daysUntilDeadline` | int | **Вычисляется** | `floor((deadline - now) / 86400000)`, может быть отрицательным |

### 4.2 Feature vector (11 числовых признаков для модели)

Формируется в `features.py → extract_features()`:

| # | Feature | Тип | Как формируется | Категория |
|---|---------|-----|----------------|-----------|
| 1 | `difficulty` | float | `float(task.difficulty)` | Прямой |
| 2 | `assignee_count` | float | `float(task.assigneeCount)` | Прямой |
| 3 | `assignee_load` | float | `float(task.assigneeLoad)` | Прямой |
| 4 | `status_changes_count` | float | `float(task.statusChangesCount)` | Прямой |
| 5 | `days_since_creation` | float | `float(task.daysSinceCreation)` | Прямой |
| 6 | `days_until_deadline` | float | `float(task.daysUntilDeadline)` | Прямой |
| 7 | `deadline_passed` | float (0/1) | `1.0 if daysUntilDeadline < 0` | Вычисляемый |
| 8 | `deadline_critical` | float (0/1) | `1.0 if 0 <= daysUntilDeadline <= 2 AND status != "review"` | Вычисляемый |
| 9 | `is_unassigned` | float (0/1) | `1.0 if assigneeCount == 0` | Вычисляемый |
| 10 | `high_difficulty_high_load` | float (0/1) | `1.0 if difficulty >= 4 AND assigneeLoad > 5` | Вычисляемый |
| 11 | `difficulty_deadline_ratio` | float | `difficulty / max(daysUntilDeadline, 1)` | Вычисляемый |

---

## 5. Подготовка данных

### Feature extraction

Функция `extract_features()` в `features.py` принимает валидированный Pydantic-объект `TaskRiskInput` и возвращает `np.ndarray` из 11 float-значений.

### Preprocessing / Scaling / Encoding

- **Скейлинг (StandardScaler, MinMaxScaler): не используется.** GradientBoosting — tree-based модель, не требует нормализации.
- **Encoding категорий:** поле `status` не попадает в feature vector напрямую. Оно используется только для вычисления бинарного признака `deadline_critical`.
- Все бинарные флаги уже представлены как 0.0/1.0.

### Обработка null / invalid values

| Ситуация | Как обрабатывается |
|----------|-------------------|
| Невалидные значения | Pydantic-валидация: difficulty 1-5, assigneeCount >= 0 и т.д. Невалидный запрос → HTTP 422 |
| Null-поля | Все поля обязательны (Pydantic), null невозможен |
| Деление на ноль | `safe_deadline = max(daysUntilDeadline, 1)` для `difficulty_deadline_ratio` |
| Выход за [0,1] | `min(max(raw_prob, 0.0), 1.0)` на выходе модели |

### Single vs Batch

| Режим | Feature extraction | Model.predict() | Постпроцессинг |
|-------|-------------------|-----------------|----------------|
| Single | `extract_features(task)` → reshape `(1, 11)` | 1 вызов | 1 задача |
| Batch | `extract_features_batch(tasks)` → `(N, 11)` | **1 вызов** (vectorized) | Цикл по N задачам |

Batch-лимит: **1000 задач** за один запрос к ML-сервису.

---

## 6. Модель

### Тип и параметры

```python
GradientBoostingRegressor(
    n_estimators=200,      # 200 деревьев в ансамбле
    max_depth=5,           # максимальная глубина дерева
    learning_rate=0.1,     # скорость обучения
    subsample=0.8,         # 80% данных на каждое дерево
    random_state=42,       # воспроизводимость
)
```

Это **регрессор**, не классификатор. Предсказывает непрерывное значение `delayProbability` (0.0–1.0).

### Хранение и загрузка

| Артефакт | Формат | Содержимое |
|----------|--------|-----------|
| `models/risk_model.joblib` | joblib (pickle) | Сериализованный GradientBoostingRegressor |
| `models/risk_model_meta.json` | JSON | `trained_at`, `sample_size`, `version`, `metrics` |

Загрузка при старте сервиса (lifespan FastAPI):

```
model_manager.load_or_init()
├── Есть ли .joblib + .json на диске?
│   ├── Да → joblib.load() + json.load()
│   │        ├── Успех → модель готова
│   │        └── Ошибка → обучить новую
│   └── Нет → обучить новую модель (5000 сэмплов)
```

### Проверка доступности

- Свойство `model_manager.is_loaded` → `self._model is not None`
- `/predict` возвращает **503**, если модель не загружена
- `/health` возвращает `status: "ok"` или `"degraded"`

### Метаданные текущей модели

```json
{
  "trained_at": "2026-03-25T14:15:18.443563",
  "sample_size": 5000,
  "version": "1.0.0",
  "metrics": {
    "cv_rmse_mean": 0.0384,
    "cv_rmse_std": 0.001,
    "n_samples": 5000,
    "n_features": 11,
    "feature_names": ["difficulty", "assignee_count", ...]
  }
}
```

---

## 7. Выход модели

### Raw output

`GradientBoostingRegressor.predict()` возвращает **один float** для каждой задачи — raw вероятность задержки. Это **единственное**, что выдает ML-модель.

### Постпроцессинг (всё в model.py)

| # | Поле ответа | Тип | Источник | Как формируется |
|---|------------|-----|---------|----------------|
| 1 | `delayProbability` | float (0–1) | **Модель** | `round(clamp(raw_prob, 0, 1), 2)` |
| 2 | `riskLevel` | string | **Постпроцессинг** | >0.6 → "high", >0.3 → "medium", иначе "low" |
| 3 | `riskFactors` | list[str] | **Rule-based** | Проверяет входные поля задачи, **НЕ зависит от delayProbability** |
| 4 | `recommendation` | string | **Постпроцессинг** | Подбирается по riskLevel и riskFactors |
| 5 | `predictedCompletionDate` | string (ISO) | **Формула** | `deadline + (deadline - createdAt) * delayProbability * 0.5` |

### Логика определения riskFactors

```python
if daysUntilDeadline < 0:
    → "Дедлайн уже прошёл"
elif daysUntilDeadline <= 2 and status != "review":
    → "До дедлайна менее 2 дней, задача не на ревью"

if difficulty >= 4 and assigneeLoad > 5:
    → "Высокая сложность задачи и высокая нагрузка на исполнителя"
elif difficulty >= 3 and daysUntilDeadline <= 5:
    → "Средняя/высокая сложность при близком дедлайне"

if assigneeCount == 0:
    → "Задача не назначена исполнителю"

if statusChangesCount > 3:
    → "Частые изменения статуса (возможная нестабильность)"
```

### Логика рекомендаций

| Условие | Рекомендация |
|---------|-------------|
| riskLevel == "low" | "Задача находится в зелёной зоне. Продолжайте в текущем режиме." |
| Фактор: дедлайн прошёл | "Необходимо срочно пересмотреть сроки или перераспределить ресурсы." |
| Фактор: не на ревью | "Рекомендуется ускорить завершение задачи и передать на ревью." |
| Фактор: нагрузка | "Рассмотрите возможность переназначения задачи или снижения нагрузки исполнителя." |
| Фактор: не назначена | "Назначьте исполнителя для задачи." |
| Фактор: близкий дедлайн | "Контролируйте ход выполнения задачи ежедневно." |
| Ничего из вышеперечисленного | "Обратите внимание на факторы риска и при необходимости скорректируйте план." |

---

## 8. Как формируется итоговый API-ответ

### 8.1 Ответ по задаче (TaskRiskOutputDto)

```json
{
  "predictedCompletionDate": "2026-04-05T14:30:00.000Z",
  "delayProbability": 0.65,
  "riskLevel": "high",
  "riskFactors": ["Дедлайн уже прошёл", "Задача не назначена исполнителю"],
  "recommendation": "Необходимо срочно пересмотреть сроки... Назначьте исполнителя..."
}
```

| Поле | Кто формирует | Как |
|------|--------------|-----|
| `delayProbability` | ML-модель (Python) | Raw output модели, clamped + rounded |
| `riskLevel` | Python постпроцессинг | Пороги: >0.6 high, >0.3 medium, low |
| `riskFactors` | Python rule-based | По входным полям задачи, не по предсказанию |
| `recommendation` | Python rule-based | По riskFactors + riskLevel |
| `predictedCompletionDate` | Python формула | `deadline + duration * probability * 0.5` |

Backend (RiskMlService) **не изменяет** поля — передаёт ответ ML-сервиса как есть.

### 8.2 Ответ по проекту (ProjectRiskOutputDto)

```json
{
  "riskScore": 55,
  "riskLevel": "medium",
  "tasksAtRisk": [
    { "taskId": 42, "taskName": "Auth feature", "delayProbability": 0.72 }
  ],
  "summary": "Проект имеет средний уровень риска (55/100). 3 из 8 активных задач требуют внимания."
}
```

| Поле | Кто формирует | Как |
|------|--------------|-----|
| `riskScore` | **Backend** | `round(avg(delayProbability всех задач) * 100)` |
| `riskLevel` | **Backend** | По riskScore: >60 high, >30 medium, low |
| `tasksAtRisk` | **Backend** | Задачи с delayProbability > 0.3, отсортированы по убыванию |
| `summary` | **Backend** | Текст на русском по шаблону |

---

## 9. Fallback и отказоустойчивость

### Двухуровневый fallback

```
┌─────────────────────────────────────────────────┐
│ Уровень 1: Compile-time (env RISK_PROVIDER)     │
│                                                  │
│   RISK_PROVIDER=ml   → RiskMlService             │
│   RISK_PROVIDER=stub → RiskStubService (без ML)  │
└─────────────────────────────────────────────────┘
                       │
                       ▼ (если RISK_PROVIDER=ml)
┌─────────────────────────────────────────────────┐
│ Уровень 2: Runtime fallback                      │
│                                                  │
│   RiskMlService.assessTask(input)                │
│   ├── mlClient.predict(input)                    │
│   │   ├── Успех → вернуть ML-ответ               │
│   │   └── null → stubService.assessTask(input)   │
│   │              (бесшовный fallback)             │
└─────────────────────────────────────────────────┘
```

### Когда MlClientService возвращает null

| Ситуация | Поведение |
|----------|----------|
| ML-сервис не запущен | Connection refused → catch → return null |
| Timeout (>10 сек) | AbortController.abort() → catch → return null |
| HTTP не-2xx статус | response.ok === false → return null |
| Сетевая ошибка | Любое исключение → catch → return null |

### Что видит клиент при fallback

Клиент **не знает**, что сработал fallback. Структура ответа идентична. Разница: stub выдает фиксированные вероятности (0.95, 0.7, 0.6, 0.4), ML — непрерывные значения.

### При повреждённых артефактах модели

Если `joblib.load()` упал при старте → ML-сервис обучает новую модель с нуля на 5000 синтетических сэмплах и продолжает работу.

---

## 10. Batch и runtime-вызовы

### Эффективность вызовов

| Сценарий | DB-запросы | HTTP к ML | model.predict() |
|----------|-----------|-----------|-----------------|
| Single task | 3 (task, audit_logs, project_tasks) | 1 POST /predict | 1 |
| Project (N задач) | 3 (project, tasks, audit_logs) | 1 POST /predict/batch | **1** (vectorized) |
| K проектов (M задач) | 2 (findByProjects, findByEntityIds) | **1** POST /predict/batch | **1** (vectorized) |

Batch реализован корректно — **нет проблемы N+1**. ML-сервис получает один запрос и делает один вызов `model.predict()` с матрицей `(N, 11)`.

### Ограничения

- Batch-лимит: 1000 задач за один вызов
- Расчёт `assigneeLoad` имеет сложность `O(T * A * T)` (T=задачи, A=assignees)

---

## 11. Retrain / обновление модели

### Retrain реализован

#### Как запускается

```
POST /risk/retrain (только ADMIN)
  → MlClientService.retrain()
    → HTTP POST http://ml-service:8000/retrain { sample_size: 5000 }
```

#### Данные для обучения

Модель обучается на **синтетических данных**, а не на реальных данных из БД:

```python
difficulty = random.randint(1, 5)
assignee_count = random.choice([0, 1, 1, 2, 2, 3])
assignee_load = random.randint(0, 10)
days_until_deadline = random.randint(-10, 30)
# ... и т.д.
```

Labels генерируются **rule-based логикой**, идентичной RiskStubService:

| Условие | delayProbability |
|---------|-----------------|
| `daysUntilDeadline < 0` | 0.90 + noise(0, 0.1) |
| `daysUntilDeadline <= 2 && status != review` | 0.60 + noise(0, 0.2) |
| `difficulty >= 4 && assigneeLoad > 5` | 0.50 + noise(0, 0.2) |
| `difficulty >= 3 && daysUntilDeadline <= 5` | 0.30 + noise(0, 0.2) |
| Иначе | 0.05 + difficulty * 0.05 + noise(0, 0.1) |
| +unassigned | +0.10 |
| +statusChanges > 3 | +0.05 |

#### Процесс обучения

1. Генерация N синтетических сэмплов (по умолчанию 5000)
2. Извлечение features → матрица `(N, 11)`
3. Cross-validation (5-fold, RMSE)
4. Обучение на полном датасете (`model.fit(X, y)`)
5. Сохранение на диск (quasi-atomic: запись во .tmp → os.replace)
6. Замена модели в памяти под `threading.Lock()`

#### Безопасность retrain

```
Retrain запущен
├── Обучение прошло успешно
│   ├── Сохранение .tmp на диск
│   ├── os.replace(.tmp → финальный файл)
│   └── Замена in-memory модели (под lock)
│       → Старая модель работала до этого момента
│       → Нет downtime
│
└── Обучение / сохранение упало
    ├── .tmp файлы удаляются
    ├── In-memory модель НЕ заменяется
    └── Старая модель продолжает работать
        → API возвращает 500: "Previous model remains active"
```

---

## 12. Практическое объяснение простыми словами

Система управления проектами содержит ML-модуль, который **предсказывает вероятность того, что задача будет выполнена с задержкой**.

### Что происходит, когда пользователь запрашивает оценку риска:

1. **Backend собирает данные о задаче** из базы данных: сложность (1–5), сколько исполнителей назначено, насколько они загружены другими задачами, сколько раз менялся статус задачи, когда была создана, когда дедлайн.

2. **Данные отправляются в ML-сервис** — отдельное Python-приложение. Там из 10 полей формируются 11 числовых признаков. К исходным 6 числам добавляются 5 вычисляемых: прошёл ли дедлайн (да/нет), критический ли дедлайн (да/нет), назначена ли задача (да/нет), перегружен ли исполнитель (да/нет), отношение сложности к оставшемуся времени.

3. **11 чисел подаются в модель** — ансамбль из 200 решающих деревьев (GradientBoosting). Модель выдаёт одно число: вероятность задержки от 0.0 до 1.0.

4. **Python-сервис достраивает ответ:**
   - Переводит число в уровень риска (low / medium / high).
   - Определяет факторы риска (не по предсказанию модели, а по правилам на основе входных данных).
   - Подбирает текстовую рекомендацию на русском.
   - Рассчитывает прогнозируемую дату завершения.

5. **Backend получает готовый ответ и отдаёт клиенту.** Для проектов backend дополнительно агрегирует результаты по задачам: считает средний балл (0–100), формирует список рисковых задач, генерирует текстовое резюме.

6. **Если ML-сервис недоступен** (упал, тайм-аут, ошибка), backend автоматически переключается на встроенный rule-based расчёт. Пользователь не замечает разницы.

7. **Модель обучена на синтетических данных** с labels, рассчитанными по тем же правилам, что и в rule-based fallback. ML аппроксимирует rule-based логику, но может улавливать нелинейные взаимодействия между признаками.

---

## 13. Что важно проверить вручную

### Endpoint 1: Оценка риска задачи

```http
GET /tasks/{id}/risk
Authorization: Bearer <token>
```

**Входные данные:** ID существующей задачи с дедлайном в прошлом.

**Ожидаемый ответ:**
```json
{
  "delayProbability": 0.90,
  "riskLevel": "high",
  "riskFactors": ["Дедлайн уже прошёл"],
  "recommendation": "Необходимо срочно пересмотреть сроки...",
  "predictedCompletionDate": "2026-04-05T..."
}
```

**Что подтвердит:** ML-сервис работает, модель загружена, постпроцессинг корректен.

---

### Endpoint 2: Статус ML-сервиса (только ADMIN)

```http
GET /risk/ml-status
Authorization: Bearer <admin-token>
```

**Ожидаемый ответ:**
```json
{
  "provider": "ml",
  "health": { "status": "ok", "model_loaded": true, "version": "1.0.0" },
  "modelInfo": {
    "model_type": "GradientBoostingRegressor",
    "features": ["difficulty", "assignee_count", ...],
    "metrics": { "cv_rmse_mean": 0.0384 }
  }
}
```

**Что подтвердит:** ML-сервис доступен, модель загружена, метаданные корректны.

---

### Endpoint 3: Проверка fallback

Остановить ML-сервис (`docker stop ml-service`), затем:

```http
GET /tasks/{id}/risk
```

**Ожидаемый ответ:** та же структура, но с фиксированными значениями stub (0.95, 0.7, 0.6, 0.4). Без ошибок 500/503.

**Что подтвердит:** fallback работает бесшовно, система не падает без ML.

---

### Endpoint 4: Оценка риска проекта

```http
GET /projects/{id}/risk
Authorization: Bearer <token>
```

**Ожидаемый ответ:**
```json
{
  "riskScore": 55,
  "riskLevel": "medium",
  "tasksAtRisk": [{ "taskId": 42, "taskName": "...", "delayProbability": 0.72 }],
  "summary": "Проект имеет средний уровень риска (55/100)..."
}
```

**Что подтвердит:** batch prediction работает, агрегация корректна.

---

### Endpoint 5: Переобучение модели (только ADMIN)

```http
POST /risk/retrain
Authorization: Bearer <admin-token>
```

**Ожидаемый ответ:**
```json
{
  "status": "success",
  "message": "Model retrained on 5000 samples",
  "metrics": { "cv_rmse_mean": 0.038 }
}
```

**Что подтвердит:** retrain pipeline работает, новая модель активируется без downtime.

---

### На что обратить особое внимание

1. **riskFactors не зависят от delayProbability.** Можно получить `delayProbability: 0.15` (low) с фактором "Дедлайн уже прошёл" — факторы определяются rule-based, а не моделью.

2. **assigneeLoad считается только в рамках проекта.** Нагрузка исполнителя в других проектах не учитывается.

3. **Модель обучена на синтетических данных**, а не на реальной истории задач. Retrain также использует синтетику.

4. **predictedCompletionDate** использует формулу `deadline + (deadline - createdAt) * delayProbability * 0.5` — при длительных задачах с высокой вероятностью дата может уехать далеко в будущее.
