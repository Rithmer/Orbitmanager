import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException

from .model import model_manager, FEATURE_NAMES
from .schemas import (
    PredictRequest,
    PredictResponse,
    BatchPredictRequest,
    BatchPredictResponse,
    RetrainRequest,
    RetrainResponse,
    ModelInfoResponse,
    HealthResponse,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Loading ML model on startup...")
    model_manager.load_or_init()
    logger.info("ML model ready.")
    yield
    logger.info("Shutting down ML service.")


app = FastAPI(
    title="Risk Assessment ML Service",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        status="ok" if model_manager.is_loaded else "degraded",
        model_loaded=model_manager.is_loaded,
        version=model_manager.version,
    )


@app.get("/model/info", response_model=ModelInfoResponse)
async def model_info():
    meta = model_manager.metadata
    return ModelInfoResponse(
        model_type="GradientBoostingRegressor",
        version=model_manager.version,
        trained_at=meta.get("trained_at") if meta else None,
        sample_size=meta.get("sample_size") if meta else None,
        features=FEATURE_NAMES,
        metrics=meta.get("metrics") if meta else None,
    )


@app.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest):
    if not model_manager.is_loaded:
        raise HTTPException(status_code=503, detail="Model not loaded")

    try:
        prediction = model_manager.predict(request.task, llm=request.llm)
        return PredictResponse(prediction=prediction)
    except Exception as e:
        logger.error("Prediction error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/batch", response_model=BatchPredictResponse)
async def predict_batch(request: BatchPredictRequest):
    if not model_manager.is_loaded:
        raise HTTPException(status_code=503, detail="Model not loaded")

    if len(request.tasks) == 0:
        return BatchPredictResponse(predictions={})

    if len(request.tasks) > 1000:
        raise HTTPException(
            status_code=400, detail="Batch size exceeds maximum of 1000"
        )

    try:
        predictions = model_manager.predict_batch(request.tasks)
        return BatchPredictResponse(predictions=predictions)
    except Exception as e:
        logger.error("Batch prediction error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/retrain", response_model=RetrainResponse)
async def retrain(request: RetrainRequest = RetrainRequest()):
    try:
        metadata = model_manager.retrain(sample_size=request.sample_size)
        return RetrainResponse(
            status="success",
            message=f"Model retrained on {request.sample_size} samples",
            metrics=metadata.get("metrics"),
        )
    except Exception as e:
        logger.error("Retrain error: %s", e)
        raise HTTPException(
            status_code=500,
            detail=f"Retrain failed: {str(e)}. Previous model remains active.",
        )
