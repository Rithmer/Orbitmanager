import os
import tempfile

import pytest

from app.model import ModelManager
from app.schemas import TaskRiskInput


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


@pytest.fixture
def manager(tmp_path):
    os.environ["MODELS_DIR"] = str(tmp_path)
    from app import model
    original = model.MODELS_DIR
    model.MODELS_DIR = str(tmp_path)
    mgr = ModelManager()
    yield mgr
    model.MODELS_DIR = original


def test_load_or_init_trains_when_no_model(manager):
    assert not manager.is_loaded
    manager.load_or_init()
    assert manager.is_loaded
    assert manager.metadata is not None


def test_predict_single(manager):
    manager.load_or_init()
    task = _make_task()
    result = manager.predict(task)
    assert 0.0 <= result.delayProbability <= 1.0
    assert result.riskLevel in ("low", "medium", "high")
    assert isinstance(result.riskFactors, list)
    assert isinstance(result.recommendation, str)
    assert isinstance(result.predictedCompletionDate, str)


def test_predict_batch(manager):
    manager.load_or_init()
    tasks = [_make_task(taskId=i) for i in range(5)]
    results = manager.predict_batch(tasks)
    assert len(results) == 5
    for task_id, result in results.items():
        assert 0.0 <= result.delayProbability <= 1.0


def test_predict_high_risk_task(manager):
    manager.load_or_init()
    task = _make_task(difficulty=5, daysUntilDeadline=-5, assigneeCount=0)
    result = manager.predict(task)
    assert result.delayProbability > 0.5
    assert len(result.riskFactors) > 0


def test_retrain_preserves_model_on_success(manager):
    manager.load_or_init()
    old_meta = manager.metadata
    new_meta = manager.retrain(sample_size=100)
    assert new_meta is not None
    assert manager.is_loaded
    assert manager.metadata["trained_at"] != old_meta["trained_at"]


def test_predict_without_model_raises(manager):
    with pytest.raises(RuntimeError, match="not loaded"):
        manager.predict(_make_task())
