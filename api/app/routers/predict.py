import io
import logging
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import verify_token
from app.db.base import get_db
from app.db.models import Prediction
from app.schemas.predict import PredictResponse
from app.services.model import ModelService
from app.metrics import predictions_by_class, confidence_scores

logger = logging.getLogger(__name__)

router = APIRouter()

_MAX_SIZE_BYTES = 10 * 1024 * 1024  # 10 Mo
_ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png"}
_MAGIC_BYTES = {
    b"\xff\xd8\xff": "image/jpeg",
    b"\x89PNG":      "image/png",
}


def _check_magic(data: bytes) -> bool:
    for magic in _MAGIC_BYTES:
        if data.startswith(magic):
            return True
    return False


@router.post(
    "/predict",
    response_model=PredictResponse,
    summary="Classify waste image",
    description="Upload a JPEG or PNG image (max 10MB). Returns predicted waste class, confidence score and bin recommendation. Requires Bearer JWT token.",
    response_description="Waste classification result",
    responses={
        400: {"description": "Invalid image (format, size or content)"},
        401: {"description": "Token expired or invalid"},
        500: {"description": "Model inference failed"},
    },
)
async def predict(
    file: UploadFile = File(...),
    payload: dict = Depends(verify_token),
    db: AsyncSession = Depends(get_db),
) -> PredictResponse:
    if file.content_type not in _ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG and PNG images are accepted.")

    raw = await file.read()

    if len(raw) > _MAX_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="File exceeds the 10 MB size limit.")

    if not _check_magic(raw):
        raise HTTPException(status_code=400, detail="File content does not match a valid JPEG or PNG.")

    try:
        image = Image.open(io.BytesIO(raw)).convert("RGB")
    except UnidentifiedImageError:
        raise HTTPException(status_code=400, detail="Image file is corrupted or unreadable.")

    try:
        result = ModelService.get_instance().predict(image)
    except Exception as exc:
        logger.exception("Model inference failed: %s", exc)
        raise HTTPException(status_code=500, detail="Model inference failed.")

    predictions_by_class.labels(predicted_class=result["predicted_class"]).inc()
    confidence_scores.observe(result["confidence"])

    try:
        prediction = Prediction(
            user_id=uuid.UUID(payload["user_id"]),
            predicted_class=result["predicted_class"],
            confidence=result["confidence"],
        )
        db.add(prediction)
        await db.commit()
    except Exception as exc:
        logger.exception("Failed to persist prediction: %s", exc)

    return PredictResponse(**result)
