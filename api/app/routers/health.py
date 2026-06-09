import os

from fastapi import APIRouter

router = APIRouter()


@router.get(
    "/health",
    summary="Health check",
    description="Returns API status, version and environment. No authentication required.",
    response_description="API is healthy",
)
def health_check():
    return {
        "status": "ok",
        "version": os.getenv("VERSION", "unknown"),
        "environment": os.getenv("ENVIRONMENT", "unknown"),
    }
