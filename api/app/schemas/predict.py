from pydantic import BaseModel


class PredictResponse(BaseModel):
    predicted_class: str
    confidence: float
    bin_recommendation: str
