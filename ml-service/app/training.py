import random
import numpy as np
from datetime import datetime, timedelta

from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import cross_val_score

from .schemas import TaskRiskInput
from .features import extract_features_batch, FEATURE_NAMES

STATUSES = ["new", "in_progress", "review", "done", "cancelled"]
ACTIVE_STATUSES = ["new", "in_progress", "review"]


def generate_synthetic_sample() -> tuple[TaskRiskInput, float]:
    """Generate a single synthetic task with a known delay probability label."""
    difficulty = random.randint(1, 5)
    assignee_count = random.choice([0, 1, 1, 2, 2, 3])
    assignee_load = random.randint(0, 10) if assignee_count > 0 else 0
    status_changes = random.randint(0, 8)
    status = random.choice(ACTIVE_STATUSES)

    days_since_creation = random.randint(1, 60)
    days_until_deadline = random.randint(-10, 30)

    now = datetime.utcnow()
    created_at = now - timedelta(days=days_since_creation)
    deadline = now + timedelta(days=days_until_deadline)

    task = TaskRiskInput(
        taskId=random.randint(1, 10000),
        difficulty=difficulty,
        deadline=deadline.isoformat(),
        createdAt=created_at.isoformat(),
        status=status,
        assigneeCount=assignee_count,
        assigneeLoad=assignee_load,
        statusChangesCount=status_changes,
        daysSinceCreation=days_since_creation,
        daysUntilDeadline=days_until_deadline,
    )

    # Generate label based on rules (matching RiskStubService logic)
    if days_until_deadline < 0:
        delay_prob = 0.90 + random.uniform(0, 0.1)
    elif days_until_deadline <= 2 and status != "review":
        delay_prob = 0.60 + random.uniform(0, 0.2)
    elif difficulty >= 4 and assignee_load > 5:
        delay_prob = 0.50 + random.uniform(0, 0.2)
    elif difficulty >= 3 and days_until_deadline <= 5:
        delay_prob = 0.30 + random.uniform(0, 0.2)
    else:
        delay_prob = 0.05 + difficulty * 0.05 + random.uniform(0, 0.1)

    # Additional factors
    if assignee_count == 0:
        delay_prob = min(delay_prob + 0.1, 1.0)
    if status_changes > 3:
        delay_prob = min(delay_prob + 0.05, 1.0)

    delay_prob = round(min(max(delay_prob, 0.0), 1.0), 4)

    return task, delay_prob


def generate_synthetic_dataset(
    n_samples: int = 5000,
) -> tuple[np.ndarray, np.ndarray, list[TaskRiskInput]]:
    """Generate a synthetic dataset for training."""
    tasks = []
    labels = []
    for _ in range(n_samples):
        task, label = generate_synthetic_sample()
        tasks.append(task)
        labels.append(label)

    X = extract_features_batch(tasks)
    y = np.array(labels)
    return X, y, tasks


def train_model(
    n_samples: int = 5000,
) -> tuple[GradientBoostingRegressor, dict]:
    """Train a GradientBoosting model on synthetic data and return model + metrics."""
    X, y, _ = generate_synthetic_dataset(n_samples)

    model = GradientBoostingRegressor(
        n_estimators=200,
        max_depth=5,
        learning_rate=0.1,
        subsample=0.8,
        random_state=42,
    )

    # Cross-validate
    cv_scores = cross_val_score(model, X, y, cv=5, scoring="neg_mean_squared_error")
    rmse_scores = np.sqrt(-cv_scores)

    # Train on full dataset
    model.fit(X, y)

    metrics = {
        "cv_rmse_mean": round(float(rmse_scores.mean()), 4),
        "cv_rmse_std": round(float(rmse_scores.std()), 4),
        "n_samples": n_samples,
        "n_features": X.shape[1],
        "feature_names": FEATURE_NAMES,
    }

    return model, metrics
