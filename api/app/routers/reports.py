import json
import os
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from app.core.dependencies import require_role

REPORTS_PATH = Path(os.getenv("REPORTS_PATH", "/app/reports"))

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get(
    "/evaluation",
    summary="Get evaluation metrics",
    description="Returns model evaluation metrics (accuracy, F1, precision, recall per class). Requires admin role.",
    responses={
        401: {"description": "Token expired or invalid"},
        403: {"description": "Requires admin role"},
        404: {"description": "Evaluation report not found"},
    },
)
async def get_evaluation(_: dict = Depends(require_role("admin"))) -> dict:
    report_path = REPORTS_PATH / "evaluation_report.json"
    if not report_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Evaluation report not found. Run model training to generate it.",
        )
    return json.loads(report_path.read_text())


@router.get(
    "/confusion-matrix",
    summary="Get confusion matrix image",
    description="Returns the confusion matrix as a PNG image. Requires admin role.",
    responses={
        401: {"description": "Token expired or invalid"},
        403: {"description": "Requires admin role"},
        404: {"description": "Confusion matrix not found"},
    },
)
async def get_confusion_matrix(_: dict = Depends(require_role("admin"))) -> FileResponse:
    matrix_path = REPORTS_PATH / "confusion_matrix.png"
    if not matrix_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Confusion matrix not found. Run model training to generate it.",
        )
    return FileResponse(matrix_path, media_type="image/png")
