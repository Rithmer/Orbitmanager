import os
import tempfile

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(autouse=True)
def setup_models_dir(tmp_path):
    os.environ["MODELS_DIR"] = str(tmp_path)
    from app import model
    model.MODELS_DIR = str(tmp_path)


@pytest.fixture
def client():
    from app.main import app
    from app.model import model_manager
    model_manager.load_or_init()
    return TestClient(app)


SAMPLE_TASK = {
    "taskId": 1,
    "difficulty": 3,
    "deadline": "2026-04-10T00:00:00",
    "createdAt": "2026-03-01T00:00:00",
    "status": "in_progress",
    "assigneeCount": 2,
    "assigneeLoad": 3,
    "statusChangesCount": 1,
    "daysSinceCreation": 10,
    "daysUntilDeadline": 15,
}


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["model_loaded"] is True


def test_model_info(client):
    response = client.get("/model/info")
    assert response.status_code == 200
    data = response.json()
    assert data["model_type"] == "GradientBoostingRegressor"
    assert isinstance(data["features"], list)


def test_predict(client):
    response = client.post("/predict", json={"task": SAMPLE_TASK})
    assert response.status_code == 200
    data = response.json()
    pred = data["prediction"]
    assert 0.0 <= pred["delayProbability"] <= 1.0
    assert pred["riskLevel"] in ("low", "medium", "high")


def test_predict_batch(client):
    tasks = [{**SAMPLE_TASK, "taskId": i} for i in range(3)]
    response = client.post("/predict/batch", json={"tasks": tasks})
    assert response.status_code == 200
    data = response.json()
    assert len(data["predictions"]) == 3


def test_predict_batch_empty(client):
    response = client.post("/predict/batch", json={"tasks": []})
    assert response.status_code == 200
    assert response.json()["predictions"] == {}


def test_retrain(client):
    response = client.post("/retrain", json={"sample_size": 100})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "metrics" in data
