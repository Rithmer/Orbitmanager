import logging
import os
from dataclasses import dataclass, field

import numpy as np
import pandas as pd
import psycopg2
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import cross_val_score

from .schemas import TaskRiskInput
from .features import extract_features_batch, FEATURE_NAMES

logger = logging.getLogger(__name__)

DATABASE_URL = os.environ.get("DATABASE_URL")


@dataclass
class ModelConfig:
    n_estimators: int = 200
    max_depth: int = 5
    learning_rate: float = 0.1
    subsample: float = 0.8
    random_state: int = 42
    cv_folds: int = 5


@dataclass
class TrainResult:
    model: GradientBoostingRegressor
    cv_rmse_mean: float
    cv_rmse_std: float
    n_samples: int
    n_features: int
    feature_names: list[str] = field(default_factory=list)

    def metrics(self) -> dict:
        return {
            "cv_rmse_mean": self.cv_rmse_mean,
            "cv_rmse_std": self.cv_rmse_std,
            "n_samples": self.n_samples,
            "n_features": self.n_features,
            "feature_names": self.feature_names,
        }


def load_dataset() -> tuple[np.ndarray, np.ndarray]:
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL environment variable is not set.")

    logger.info("Loading dataset from database...")
    conn = psycopg2.connect(DATABASE_URL)
    try:
        df = pd.read_sql(
            'SELECT task_id AS "taskId", difficulty, deadline, created_at AS "createdAt",'
            ' status, assignee_count AS "assigneeCount", assignee_load AS "assigneeLoad",'
            ' status_changes_count AS "statusChangesCount",'
            ' days_since_creation AS "daysSinceCreation",'
            ' days_until_deadline AS "daysUntilDeadline",'
            " delay_probability FROM ml_task_samples",
            conn,
        )
    finally:
        conn.close()

    logger.info("Loaded %d rows from database", len(df))
    if df.empty:
        raise ValueError("ml_task_samples table is empty.")

    tasks = [
        TaskRiskInput(
            taskId=int(row["taskId"]),
            difficulty=int(row["difficulty"]),
            deadline=str(row["deadline"]),
            createdAt=str(row["createdAt"]),
            status=str(row["status"]),
            assigneeCount=int(row["assigneeCount"]),
            assigneeLoad=int(row["assigneeLoad"]),
            statusChangesCount=int(row["statusChangesCount"]),
            daysSinceCreation=int(row["daysSinceCreation"]),
            daysUntilDeadline=int(row["daysUntilDeadline"]),
        )
        for _, row in df.iterrows()
    ]

    X = extract_features_batch(tasks)
    y = df["delay_probability"].to_numpy(dtype=float)

    logger.info("Dataset ready: X=%s, y=%s", X.shape, y.shape)
    return X, y


def train_model(model_cfg: ModelConfig | None = None) -> TrainResult:
    if model_cfg is None:
        model_cfg = ModelConfig()

    X, y = load_dataset()

    model = GradientBoostingRegressor(
        n_estimators=model_cfg.n_estimators,
        max_depth=model_cfg.max_depth,
        learning_rate=model_cfg.learning_rate,
        subsample=model_cfg.subsample,
        random_state=model_cfg.random_state,
    )

    logger.info("Running %d-fold cross-validation...", model_cfg.cv_folds)
    cv_scores = cross_val_score(
        model, X, y, cv=model_cfg.cv_folds, scoring="neg_mean_squared_error"
    )
    rmse_scores = np.sqrt(-cv_scores)
    logger.info("CV RMSE: %.4f ± %.4f", rmse_scores.mean(), rmse_scores.std())

    model.fit(X, y)
    logger.info("Model trained on full dataset.")

    return TrainResult(
        model=model,
        cv_rmse_mean=round(float(rmse_scores.mean()), 4),
        cv_rmse_std=round(float(rmse_scores.std()), 4),
        n_samples=len(y),
        n_features=X.shape[1],
        feature_names=FEATURE_NAMES,
    )
