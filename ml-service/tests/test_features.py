import numpy as np
from app.schemas import TaskRiskInput
from app.features import extract_features, extract_features_batch, FEATURE_NAMES


def _make_task(**overrides) -> TaskRiskInput:
    defaults = dict(
        taskId=1,
        difficulty=3,
        deadline="2026-04-10T00:00:00",
        createdAt="2026-03-01T00:00:00",
        status="in_progress",
        assigneeCount=2,
        assigneeLoad=3,
        statusChangesCount=1,
        daysSinceCreation=10,
        daysUntilDeadline=15,
    )
    defaults.update(overrides)
    return TaskRiskInput(**defaults)


def test_extract_features_shape():
    task = _make_task()
    features = extract_features(task)
    assert features.shape == (len(FEATURE_NAMES),)


def test_extract_features_values():
    task = _make_task(difficulty=4, assigneeCount=0, daysUntilDeadline=-2)
    features = extract_features(task)

    assert features[0] == 4.0  # difficulty
    assert features[1] == 0.0  # assignee_count
    assert features[6] == 1.0  # deadline_passed (daysUntilDeadline < 0)
    assert features[8] == 1.0  # is_unassigned


def test_extract_features_batch():
    tasks = [_make_task(taskId=i) for i in range(5)]
    matrix = extract_features_batch(tasks)
    assert matrix.shape == (5, len(FEATURE_NAMES))


def test_deadline_critical_flag():
    task = _make_task(daysUntilDeadline=1, status="new")
    features = extract_features(task)
    assert features[7] == 1.0  # deadline_critical

    task_review = _make_task(daysUntilDeadline=1, status="review")
    features_review = extract_features(task_review)
    assert features_review[7] == 0.0  # NOT critical if in review


def test_high_difficulty_high_load_flag():
    task = _make_task(difficulty=4, assigneeLoad=6)
    features = extract_features(task)
    assert features[9] == 1.0  # high_difficulty_high_load

    task_low = _make_task(difficulty=3, assigneeLoad=6)
    features_low = extract_features(task_low)
    assert features_low[9] == 0.0
