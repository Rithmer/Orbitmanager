from app.training import generate_synthetic_sample, generate_synthetic_dataset, train_model


def test_generate_synthetic_sample():
    task, label = generate_synthetic_sample()
    assert 0.0 <= label <= 1.0
    assert 1 <= task.difficulty <= 5
    assert task.assigneeCount >= 0


def test_generate_synthetic_dataset():
    X, y, tasks = generate_synthetic_dataset(n_samples=100)
    assert X.shape == (100, 11)
    assert y.shape == (100,)
    assert len(tasks) == 100
    assert all(0.0 <= label <= 1.0 for label in y)


def test_train_model():
    model, metrics = train_model(n_samples=200)
    assert model is not None
    assert "cv_rmse_mean" in metrics
    assert "n_samples" in metrics
    assert metrics["n_samples"] == 200
    assert metrics["cv_rmse_mean"] < 0.5  # sanity check
