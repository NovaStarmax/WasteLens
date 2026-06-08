import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PredictionResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    predicted_class: str
    confidence: float
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class HistoryResponse(BaseModel):
    predictions: list[PredictionResponse]
    total: int
    skip: int
    limit: int
