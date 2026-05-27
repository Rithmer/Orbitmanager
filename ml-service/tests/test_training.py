import os

import pytest

from app.training import load_dataset, train_model

pytestmark = pytest.mark.skipif(
    not os.environ.get("DATABASE_URL"),
    reason="DATABASE_URL not set",
)


def test_load_dataset():
    X, y = load_dataset()
    assert X.shape[0] > 0
    assert y.shape[0] == X.shape[0]
    assert all(0.0 <= v <= 1.0 for v in y)


def test_train_model():
    result = train_model()
    assert result.model is not None
    assert result.n_samples > 0
    assert result.cv_rmse_mean < 0.5
