from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class TaskRiskInput(BaseModel):
    taskId: int
    difficulty: int = Field(ge=1, le=5)
    deadline: str
    createdAt: str
    status: str
    assigneeCount: int = Field(ge=0)
    assigneeLoad: int = Field(ge=0)
    statusChangesCount: int = Field(ge=0)
    daysSinceCreation: int
    daysUntilDeadline: int


class TaskRiskOutput(BaseModel):
    predictedCompletionDate: str
    delayProbability: float = Field(ge=0.0, le=1.0)
    riskLevel: str
    riskFactors: List[str]
    recommendation: str


class PredictRequest(BaseModel):
    task: TaskRiskInput


class PredictResponse(BaseModel):
    prediction: TaskRiskOutput


class BatchPredictRequest(BaseModel):
    tasks: List[TaskRiskInput]


class BatchPredictResponse(BaseModel):
    predictions: Dict[int, TaskRiskOutput]


class RetrainRequest(BaseModel):
    sample_size: int = Field(default=5000, ge=100, le=100000)


class RetrainResponse(BaseModel):
    status: str
    message: str
    metrics: Optional[Dict] = None


class ModelInfoResponse(BaseModel):
    model_type: str
    version: str
    trained_at: Optional[str] = None
    sample_size: Optional[int] = None
    features: List[str]
    metrics: Optional[Dict] = None


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    version: str
