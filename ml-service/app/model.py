import os
import json
import logging
import threading
from datetime import datetime
from typing import Dict, List, Optional

import joblib
import numpy as np

from .features import extract_features, extract_features_batch, FEATURE_NAMES
from .schemas import TaskRiskInput, TaskRiskOutput
from .training import train_model

logger = logging.getLogger(__name__)

MODELS_DIR = os.environ.get("MODELS_DIR", "/app/models")
MODEL_FILE = "risk_model.joblib"
META_FILE = "risk_model_meta.json"

RISK_FACTORS_MAP = {
    "deadline_passed": "Дедлайн уже прошёл",
    "deadline_critical": "До дедлайна менее 2 дней, задача не на ревью",
    "high_difficulty_high_load": "Высокая сложность задачи и высокая нагрузка на исполнителя",
    "is_unassigned": "Задача не назначена исполнителю",
    "high_status_changes": "Частые изменения статуса (возможная нестабильность)",
    "medium_difficulty_close_deadline": "Средняя/высокая сложность при близком дедлайне",
}

RECOMMENDATIONS = {
    "low": "Задача находится в зелёной зоне. Продолжайте в текущем режиме.",
    "deadline_passed": "Необходимо срочно пересмотреть сроки или перераспределить ресурсы.",
    "deadline_critical": "Рекомендуется ускорить завершение задачи и передать на ревью.",
    "high_load": "Рассмотрите возможность переназначения задачи или снижения нагрузки исполнителя.",
    "unassigned": "Назначьте исполнителя для задачи.",
    "close_deadline": "Контролируйте ход выполнения задачи ежедневно.",
    "default": "Обратите внимание на факторы риска и при необходимости скорректируйте план.",
}


class ModelManager:
    """Thread-safe model manager with file-based persistence."""

    def __init__(self):
        self._model = None
        self._metadata: Optional[dict] = None
        self._lock = threading.Lock()
        self._version = "1.0.0"

    @property
    def is_loaded(self) -> bool:
        return self._model is not None

    @property
    def version(self) -> str:
        return self._version

    @property
    def metadata(self) -> Optional[dict]:
        return self._metadata

    def load_or_init(self) -> None:
        """Load model from disk, or train a new one if not found."""
        model_path = os.path.join(MODELS_DIR, MODEL_FILE)
        meta_path = os.path.join(MODELS_DIR, META_FILE)

        if os.path.exists(model_path) and os.path.exists(meta_path):
            try:
                self._model = joblib.load(model_path)
                with open(meta_path, "r") as f:
                    self._metadata = json.load(f)
                logger.info("Model loaded from disk: %s", model_path)
                return
            except Exception as e:
                logger.warning("Failed to load model from disk: %s", e)

        logger.info("No model found on disk. Training initial model...")
        self.retrain(sample_size=5000)

    def retrain(self, sample_size: int = 5000) -> dict:
        """Train a new model. Only replaces the active model on success."""
        logger.info("Starting model training with %d samples...", sample_size)

        new_model, metrics = train_model(n_samples=sample_size)

        trained_at = datetime.utcnow().isoformat()
        new_metadata = {
            "trained_at": trained_at,
            "sample_size": sample_size,
            "metrics": metrics,
            "version": self._version,
        }

        # Save to disk first (atomic-ish: write to temp, then rename)
        os.makedirs(MODELS_DIR, exist_ok=True)
        model_path = os.path.join(MODELS_DIR, MODEL_FILE)
        meta_path = os.path.join(MODELS_DIR, META_FILE)
        tmp_model_path = model_path + ".tmp"
        tmp_meta_path = meta_path + ".tmp"

        try:
            joblib.dump(new_model, tmp_model_path)
            with open(tmp_meta_path, "w") as f:
                json.dump(new_metadata, f, indent=2)

            # Atomic replace
            os.replace(tmp_model_path, model_path)
            os.replace(tmp_meta_path, meta_path)
        except Exception as e:
            # Clean up temp files on failure
            for p in (tmp_model_path, tmp_meta_path):
                if os.path.exists(p):
                    os.remove(p)
            logger.error("Failed to save model to disk: %s", e)
            raise

        # Only swap in-memory model after disk save succeeds
        with self._lock:
            self._model = new_model
            self._metadata = new_metadata

        logger.info("Model retrained and saved successfully.")
        return new_metadata

    def predict(self, task: TaskRiskInput) -> TaskRiskOutput:
        """Run prediction for a single task."""
        with self._lock:
            model = self._model

        if model is None:
            raise RuntimeError("Model is not loaded")

        features = extract_features(task).reshape(1, -1)
        raw_prob = float(model.predict(features)[0])
        delay_probability = round(min(max(raw_prob, 0.0), 1.0), 2)

        risk_level = _get_risk_level(delay_probability)
        risk_factors = _get_risk_factors(task)
        recommendation = _get_recommendation(risk_factors, risk_level)
        predicted_date = _predict_completion_date(task, delay_probability)

        return TaskRiskOutput(
            predictedCompletionDate=predicted_date,
            delayProbability=delay_probability,
            riskLevel=risk_level,
            riskFactors=risk_factors,
            recommendation=recommendation,
        )

    def predict_batch(self, tasks: List[TaskRiskInput]) -> Dict[int, TaskRiskOutput]:
        """Run prediction for multiple tasks in one call."""
        if not tasks:
            return {}

        with self._lock:
            model = self._model

        if model is None:
            raise RuntimeError("Model is not loaded")

        features = extract_features_batch(tasks)
        raw_probs = model.predict(features)

        results: Dict[int, TaskRiskOutput] = {}
        for task, raw_prob in zip(tasks, raw_probs):
            delay_probability = round(min(max(float(raw_prob), 0.0), 1.0), 2)
            risk_level = _get_risk_level(delay_probability)
            risk_factors = _get_risk_factors(task)
            recommendation = _get_recommendation(risk_factors, risk_level)
            predicted_date = _predict_completion_date(task, delay_probability)

            results[task.taskId] = TaskRiskOutput(
                predictedCompletionDate=predicted_date,
                delayProbability=delay_probability,
                riskLevel=risk_level,
                riskFactors=risk_factors,
                recommendation=recommendation,
            )

        return results


def _get_risk_level(probability: float) -> str:
    if probability > 0.6:
        return "high"
    if probability > 0.3:
        return "medium"
    return "low"


def _get_risk_factors(task: TaskRiskInput) -> List[str]:
    factors = []
    if task.daysUntilDeadline < 0:
        factors.append(RISK_FACTORS_MAP["deadline_passed"])
    elif task.daysUntilDeadline <= 2 and task.status != "review":
        factors.append(RISK_FACTORS_MAP["deadline_critical"])
    if task.difficulty >= 4 and task.assigneeLoad > 5:
        factors.append(RISK_FACTORS_MAP["high_difficulty_high_load"])
    elif task.difficulty >= 3 and task.daysUntilDeadline <= 5:
        factors.append(RISK_FACTORS_MAP["medium_difficulty_close_deadline"])
    if task.assigneeCount == 0:
        factors.append(RISK_FACTORS_MAP["is_unassigned"])
    if task.statusChangesCount > 3:
        factors.append(RISK_FACTORS_MAP["high_status_changes"])
    return factors


def _get_recommendation(risk_factors: List[str], risk_level: str) -> str:
    if risk_level == "low":
        return RECOMMENDATIONS["low"]

    parts = []
    if any("прошёл" in f for f in risk_factors):
        parts.append(RECOMMENDATIONS["deadline_passed"])
    if any("не на ревью" in f for f in risk_factors):
        parts.append(RECOMMENDATIONS["deadline_critical"])
    if any("нагрузка" in f.lower() for f in risk_factors):
        parts.append(RECOMMENDATIONS["high_load"])
    if any("не назначена" in f for f in risk_factors):
        parts.append(RECOMMENDATIONS["unassigned"])
    if any("близком дедлайне" in f for f in risk_factors):
        parts.append(RECOMMENDATIONS["close_deadline"])

    return " ".join(parts) if parts else RECOMMENDATIONS["default"]


def _predict_completion_date(task: TaskRiskInput, delay_probability: float) -> str:
    from datetime import datetime, timedelta

    deadline = datetime.fromisoformat(task.deadline.replace("Z", "+00:00"))
    created = datetime.fromisoformat(task.createdAt.replace("Z", "+00:00"))
    now = datetime.utcnow().astimezone(deadline.tzinfo) if deadline.tzinfo else datetime.utcnow()

    if task.status == "done":
        return now.isoformat()

    total_duration = (deadline - created).total_seconds()
    delay_seconds = total_duration * delay_probability * 0.5
    predicted = deadline + timedelta(seconds=delay_seconds)

    if predicted < now:
        return now.isoformat()
    return predicted.isoformat()


# Singleton instance
model_manager = ModelManager()
