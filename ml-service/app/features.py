from typing import List

import numpy as np
import pandas as pd

from .schemas import TaskRiskInput

FEATURE_NAMES = [
    "difficulty",
    "assignee_count",
    "assignee_load",
    "status_changes_count",
    "days_since_creation",
    "days_until_deadline",
    "deadline_passed",
    "deadline_critical",
    "is_unassigned",
    "high_difficulty_high_load",
    "difficulty_deadline_ratio",
]


def extract_features(task: TaskRiskInput) -> np.ndarray:
    """Extract feature vector from a single TaskRiskInput."""
    deadline_passed = 1.0 if task.daysUntilDeadline < 0 else 0.0
    deadline_critical = (
        1.0 if 0 <= task.daysUntilDeadline <= 2 and task.status != "review" else 0.0
    )
    is_unassigned = 1.0 if task.assigneeCount == 0 else 0.0
    high_diff_high_load = (
        1.0 if task.difficulty >= 4 and task.assigneeLoad > 5 else 0.0
    )
    safe_deadline = max(task.daysUntilDeadline, 1)
    difficulty_deadline_ratio = task.difficulty / safe_deadline

    return np.array(
        [
            float(task.difficulty),
            float(task.assigneeCount),
            float(task.assigneeLoad),
            float(task.statusChangesCount),
            float(task.daysSinceCreation),
            float(task.daysUntilDeadline),
            deadline_passed,
            deadline_critical,
            is_unassigned,
            high_diff_high_load,
            difficulty_deadline_ratio,
        ]
    )


def extract_features_batch(tasks: List[TaskRiskInput]) -> np.ndarray:
    """Extract feature matrix from a list of TaskRiskInputs."""
    return np.array([extract_features(t) for t in tasks])


def extract_features_df(tasks: List[TaskRiskInput]) -> pd.DataFrame:
    """Extract features as a DataFrame (useful for training)."""
    rows = [extract_features(t) for t in tasks]
    return pd.DataFrame(rows, columns=FEATURE_NAMES)
