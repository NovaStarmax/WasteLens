import logging
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_role
from app.core.security import verify_token
from app.db.base import get_db
from app.db.models import Prediction
from app.schemas.history import HistoryResponse, PredictionResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/history", tags=["history"])


@router.get(
    "/me",
    response_model=HistoryResponse,
    summary="Get my prediction history",
    responses={401: {"description": "Token expired or invalid"}},
)
async def get_my_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    payload: dict = Depends(verify_token),
    db: AsyncSession = Depends(get_db),
) -> HistoryResponse:
    user_id = uuid.UUID(payload["user_id"])

    total = (await db.execute(
        select(func.count()).select_from(Prediction).where(Prediction.user_id == user_id)
    )).scalar()

    predictions = (await db.execute(
        select(Prediction)
        .where(Prediction.user_id == user_id)
        .order_by(Prediction.timestamp.desc())
        .offset(skip)
        .limit(limit)
    )).scalars().all()

    return HistoryResponse(
        predictions=[PredictionResponse.model_validate(p) for p in predictions],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get(
    "",
    response_model=HistoryResponse,
    summary="Get all prediction history (admin)",
    responses={
        401: {"description": "Token expired or invalid"},
        403: {"description": "Requires admin role"},
    },
)
async def get_all_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    user_id: Optional[str] = Query(None),
    _: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> HistoryResponse:
    uid = uuid.UUID(user_id) if user_id else None

    count_stmt = select(func.count()).select_from(Prediction)
    query = select(Prediction).order_by(Prediction.timestamp.desc()).offset(skip).limit(limit)
    if uid:
        count_stmt = count_stmt.where(Prediction.user_id == uid)
        query = query.where(Prediction.user_id == uid)

    total = (await db.execute(count_stmt)).scalar()
    predictions = (await db.execute(query)).scalars().all()

    return HistoryResponse(
        predictions=[PredictionResponse.model_validate(p) for p in predictions],
        total=total,
        skip=skip,
        limit=limit,
    )
