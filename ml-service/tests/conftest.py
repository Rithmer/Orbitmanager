"""
Shared test fixtures and patches.

Patches `app.training.train_model` (and `app.model.train_model`) globally so
that no DATABASE_URL is required when running the test suite.  The stub trains
a real GradientBoostingRegressor on randomly-generated synthetic data so that
all model-level assertions still exercise the real code paths.
"""

import numpy as np
import pytest
from sklearn.ensemble import GradientBoostingRegressor
from unittest.mock import patch

from app.training import TrainResult, FEATURE_NAMES


def _synthetic_train_model(model_cfg=None):
    """Train a tiny GBR on synthetic data — no database needed."""
    from app.training import ModelConfig

    if model_cfg is None:
        model_cfg = ModelConfig(n_estimators=10, cv_folds=2)

    rng = np.random.default_rng(42)
    n = 50
    n_features = len(FEATURE_NAMES)
    X = rng.random((n, n_features))
    y = rng.random(n)

    model = GradientBoostingRegressor(
        n_estimators=model_cfg.n_estimators,
        max_depth=model_cfg.max_depth,
        learning_rate=model_cfg.learning_rate,
        subsample=model_cfg.subsample,
        random_state=model_cfg.random_state,
    )

    from sklearn.model_selection import cross_val_score

    cv_scores = cross_val_score(
        model, X, y, cv=model_cfg.cv_folds, scoring="neg_mean_squared_error"
    )
    rmse_scores = np.sqrt(-cv_scores)
    model.fit(X, y)

    return TrainResult(
        model=model,
        cv_rmse_mean=round(float(rmse_scores.mean()), 4),
        cv_rmse_std=round(float(rmse_scores.std()), 4),
        n_samples=n,
        n_features=n_features,
        feature_names=list(FEATURE_NAMES),
    )


@pytest.fixture(autouse=True)
def patch_train_model():
    """Replace train_model with the synthetic version in all tests."""
    with patch("app.training.train_model", side_effect=_synthetic_train_model), \
         patch("app.model.train_model", side_effect=_synthetic_train_model):
        yield
